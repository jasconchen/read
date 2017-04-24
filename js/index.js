(function () {
    var Util = (function () {
        var prefix = 'html5_reader_';
        var StorageGetter = function (key) {
            return localStorage.getItem(prefix + key);
        }
        var StorageSetter = function (key, val) {
            return localStorage.setItem(prefix + key, val);
        }
        var getBSONP = function (url, callback) {
            return $.jsonp({
                url: url,
                cache: true,
                callback: 'duokan_fiction_chapter',
                success: function (result) {
                    var data = $.base64.decode(result);
                    var json = decodeURIComponent(escape(data));
                    callback(json);
                }
            })
        }
        return {
            getBSONP: getBSONP,
            StorageGetter: StorageGetter,
            StorageSetter: StorageSetter
        }
    })();

    function ReaderModel() {
        //todo 实现和阅读器相关的数据交互的方法
        var Chapter_id;
        var ChapterTotal;

        if (Util.StorageGetter('last_chapter')) {
            Chapter_id = Util.StorageGetter('last_chapter');
        }
        if (!Chapter_id) {
            Chapter_id = 1;
        }
        var init = function (UIcallback) {
            getFictionInfo(function () {
                getCurChaperContent(Chapter_id, function (data) {
                    UIcallback && UIcallback(data);
                })
            })
        }
        var getFictionInfo = function (callback) {
            $.get('data/chapter.json', function (data) {
                // todo 获得章节信息之后的回调
                Chapter_id = data.chapters[Chapter_id].chapter_id;
                ChapterTotal = data.chapters.length;
                callback && callback();
                Util.StorageSetter('last_chapter', Chapter_id);
            }, 'json')
        }
        var getCurChaperContent = function (chapter_id, callback) {
            $.get('data/data' + chapter_id + '.json', function (data) {
                if (data.result == 0) {
                    var url = data.jsonp;
                    Util.getBSONP(url, function (data) {
                        callback && callback(data);
                    })
                }
            }, 'json')
        }
        var prevChapter = function (UIcallback) {
            Chapter_id = parseInt(Chapter_id, 10);
            if (Chapter_id == 0) {
                return;
            }
            Chapter_id -= 1;
            getCurChaperContent(Chapter_id, UIcallback);
            Util.StorageSetter('last_chapter', Chapter_id);
        }
        var nextChapter = function (UIcallback) {
            Chapter_id = parseInt(Chapter_id, 10);
            if (Chapter_id == ChapterTotal) {
                return;
            }
            Chapter_id += 1;
            getCurChaperContent(Chapter_id, UIcallback);
            Util.StorageSetter('last_chapter', Chapter_id);
        }

        return {
            init: init,
            prevChapter: prevChapter,
            nextChapter: nextChapter
        }

    }

    function ReaderBaseFrame(container) {
        //todo 渲染基本的UI结构
        function parseChapterData(jsonData) {
            var jsonObj = JSON.parse(jsonData);
            var html = '<h4>' + jsonObj.t + '</h4>';
            for (var i = 0; i < jsonObj.p.length; i++) {
                html += '<p>' + jsonObj.p[i] + '</p>'
            }
            return html;
        }

        return function (data) {
            container.html(parseChapterData(data));
        }
    }

    var RootContainer = $('#fition_container');
    var Dom = {
        top_nav: $('#top-nav'),
        bottom_nav: $('.bottom_nav'),
        night_button: $('#night-button'),
        font_container: $('.font-container'),
        font_button: $('#font-button'),
        bk_container: $('#bk-container')
    }
    var Win = $(window);
    var Doc = $(document);
    var readerModel;
    var readerUI;

    // 初始化字体
    var initFontSize;

    // 默认夜间模式为false
    var NightMod = false;

    function main() {
        //todo 整个项目的入口函数
        readerModel = ReaderModel();
        readerUI = ReaderBaseFrame(RootContainer);
        readerModel.init(function (data) {
            readerUI(data);
        });
        ModuleFontSwitch();
        EvenHanlder();
    }

    function EvenHanlder() {
        //todo 交互的事件绑定
        $('#action_mid').click(function () {
            if (Dom.top_nav.css('display') == 'none') {
                Dom.bottom_nav.show();
                Dom.top_nav.show();
            } else {
                Dom.bottom_nav.hide();
                Dom.top_nav.hide();
                Dom.font_container.hide();
                Dom.font_button.find('.icon-font').removeClass('current');
            }
        });

        Dom.font_button.click(function () {
            if (Dom.font_container.css('display') == 'none') {
                Dom.font_container.show();
                Dom.font_button.find('.icon-font').addClass('current');

            } else {
                Dom.font_container.hide();
                Dom.font_button.find('.icon-font').removeClass('current');
            }
        });

        // 夜间模式切换
        Dom.night_button.click(function () {
            //todo 夜间模式切换
            if (NightMod) {
                $('#icon-day').hide();
                $('#icon-night').show();
                $('#font_normal').trigger('click');
                NightMod = false;
            } else {
                $('#icon-day').show();
                $('#icon-night').hide();
                $('#font_night').trigger('click');
                NightMod = true;
            }
        });

        // 背景切换
        Dom.bk_container.delegate('li', 'click', function () {
            //todo 触发背景切换的事件
            var bgColor = $(this).data('bgColor');
            var font = $(this).data('font');
            Dom.bk_container.find('.current').hide();
            $(this).find('.current').show();
            $('body').css('background-color', bgColor);
            $('.m-read-content').css('color', font);

            Util.StorageSetter('font_color', font);
            Util.StorageSetter('background_color', bgColor);

            var fontColor = Util.StorageGetter('font_color');
            if (fontColor == '#4e534f') {
                NightMod = true;
                $('#icon-day').show();
                $('#icon-night').hide();
            } else {
                NightMod = false;
                $('#icon-day').hide();
                $('#icon-night').show();
            }
        });

        // 字体大小切换
        $('#large-font').click(function () {
            if (initFontSize > 20) {
                return;
            }
            initFontSize += 1;
            RootContainer.css('font-size', initFontSize);
            Util.StorageSetter('font_size', initFontSize);
        });

        // 字体大小切换
        $('#small-font').click(function () {
            if (initFontSize < 12) {
                return;
            }
            initFontSize -= 1;
            RootContainer.css('font-size', initFontSize);
            Util.StorageSetter('font_size', initFontSize);
        });

        Win.scroll(function () {
            Dom.bottom_nav.hide();
            Dom.top_nav.hide();
            Dom.font_container.hide();
            Dom.font_button.find('.icon-font').removeClass('current');
        });
        $('#prev_btn').click(function () {
            //todo...获得章节的翻页数据->把数据拿出来
            readerModel.prevChapter(function (data) {
                readerUI(data);
            });
            setTimeout(function () {
                document.body.scrollTop = 0;
            }, 20);
        })
        $('#next_btn').click(function () {
            //todo...获得章节的翻页数据->把数据拿出来
            readerModel.nextChapter(function (data) {
                readerUI(data);
            });
            setTimeout(function () {
                document.body.scrollTop = 0;
            }, 20);
        })
    }


    //从缓存中读取的信息进行展示
    function ModuleFontSwitch() {
        var colorArr = [{
            value: '#F7EEE5',
            name: '米白',
            font: ''
        }, {
            value: '#E9DFC7',
            name: '纸张',
            font: '',
            id: "font_normal"
        }, {
            value: '#A4A4A4',
            name: '浅灰',
            font: ''
        }, {
            value: '#CDEFCE',
            name: '护眼',
            font: ''
        }, {
            value: '#283548',
            name: '灰蓝',
            font: '#7685a2'
        }, {
            value: '#0f1410',
            name: '夜间',
            font: '#4e534f',
            id: "font_night"
        }];

        var bkCurColor = Util.StorageGetter('background_color');
        var initBgColor = Util.StorageGetter('background_color');
        var fontColor = Util.StorageGetter('font_color');
        for (var i = 0; i < colorArr.length; i++) {
            var display = 'none';
            if (bkCurColor == colorArr[i].value) {
                display = 'block';
            }
            Dom.bk_container.append('<li id="' + colorArr[i].id + '" data-font="' + colorArr[i].font + '" data-bg-color="' + colorArr[i].value + '"><div class="current" style="display:' + display + '"></div></li>');
        }

        if (initBgColor) {
            $('body').css('background-color', initBgColor);
        }

        if (fontColor) {
            $('.m-read-content').css('color', fontColor);
        }

        if (fontColor == '#4e534f') {
            NightMod = true;
            $('#icon-day').show();
            $('#icon-night').hide();
        }

        initFontSize = Util.StorageGetter('font_size');
        initFontSize = parseInt(initFontSize);
        if (!initFontSize) {
            initFontSize = 14;
        }

        RootContainer.css('font-size', initFontSize);

    }

    main();
})();