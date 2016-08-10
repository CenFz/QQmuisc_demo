!(function(win) {
    /*
    添加样式
    @param element
    @param className
    */
    function addClass(element,className) {
        if (hasClass(element,className) == false) {
            element.className += " "+className;
        }
    }
    /*
    是否包含样式
    @param element
    @param className
    @returns {boolean}
    */
    function hasClass(element,className) {
        return !!element.className.match(new RegExp('(\\s|^)'+className+'(\\s|$)'));
        //return !!(className in element.className);
    }
    /*
    移除样式
    @param element
    @param className
    */
    function removeClass(element,className) {
        var currentClass = element.className;
        if (hasClass(element,className)) {
            currentClass = currentClass.replace(new RegExp('(\\s|^)'+className+'(\\s|$)'),' ');
            currentClass = currentClass.replace(/(^\s*)|(\s*$)/g,'');
            element.className = currentClass;
        }
    }
    /*
    自动添加或删除样式（自动切换）
    @param element
    @param className
    */
    function toggleClass(element,className) {
        if(hasClass(element,className)) {
            removeClass(element,className);
        }else{
            addClass(element,className);
        }
    }
    /*
    返回元素节点
    @param element
    @returns {HTMLElement}
    */
    function $(element) {
        return document.querySelector(element);
    }
    /*
    对象扩展
    @param target
    @param source
    @returns {object}
    */
    function extend(targer,source) {
        for (var p in source) {
            if (source.hasOwnProperty(p)) {
                targer[p] = source[p];
            }
        }
        return targer;
    }
    /*
    格式化时间
    @param time
    @returns {string}
    */
    function calcTime(time) {
        var hour,minute,second,timer = '';
        hour = String(parseInt(time / 3600,10));
        minute = String(parseInt((time % 3600) / 60, 10));
        second = String(parseInt(time % 60, 10));
        if (hour != '0') {
            if (hour.length == 1) {
                hour = '0' + hour;
            }
            timer += (hour + ':');
        }
        if (minute.length == 1) {
            minute = '0' + minute;
        }
        timer += (minute + ":");
        if (second.length == 1) {
            second = '0' + second
        }
        timer += second;
        return timer;
    }
    /*
    简单Ajax请求
    @param url
    @param callback
    @returns {boolean}
    */
    function ajax(url,callback){
        if(!url) return false;
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                var status = xhr.status;
                //console.log(status);
                if((status >= 200 && status < 300) || status == 304){
                    (callback && typeof callback == "function") && callback(xhr.responseText);
                    return true;
                }else{
                    return new Error("ajax请求失败");
                }
            }
        };
        xhr.open("GET", url, true);
        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
        xhr.send();
        return true;
    }
    /*bufferTime*/
    var bufferTimer = null;
    /*
    构造函数
    @param config
    @constructor
    */
    function SmMusic(config) {
        var defaults = this.config;
        console.log(defaults);
        this.config = extend(defaults,config);
        this.musicList = this.config.musicList || [];
        this.musicLength = this.musicList.length;

        if (!this.musicLength || !$('body')) {
            this.musicDom.listWrap.innerHTML = '<p>暂无播放记录...</p>';
        }
        this.audioDom = null; //audio对象
        this.init();


    }
    SmMusic.prototype = {
        config : {
            musicList : [], //播放列表
            defaultVolume : .7, //初始化音量 0～1.0之间
            defaultIndex : 0,   //初始化播放索引
            autoPlay : false,   //是否自动播放
            defaultMode : 1,    //播放模式
            callback : function(obj){}  //回调函数，返回当前播放媒体信息
        },
        /*创建播放列表*/
        createListDom : function() {
            var div,
                ul = '<ul>';

            for (var i = 0; i < this.musicLength; i++) {
                ul += '<li class="f-toe"><strong>'+ this.musicList[i]['title'] +
                '</strong> -- <small>'+ this.musicList[i]['singer'] + '</small></li>';

            }
            ul += '</ul>';
            div = '<div class="list-title"><h2>播放列表</h2><p>共'+this.musicLength+'首歌</p><a>添加歌曲</a><a>清空</a></div><div class="Song-list">'+ul+'</div>';
            this.musicDom.listWrap.innerHTML = div;
        },

        /*缓冲加载*/
        setBuffer : function(audio,bufferDom) {
            var w = bufferDom.parentNode.offsetWidth,
                me = this;

            bufferTimer = setInterval(function(){
                var buffer = audio.buffered.length;
                if (buffer > 0 && audio.buffered != undefined) {
                    var bufferWidth = (audio.buffered.end(buffer-1) / audio.duration)*w;
                    bufferDom.style.width = bufferWidth + 'px';
                    //me.musicDom.curThumb.style.left = bufferWidth + 'px';
                    if (Math.abs(audio.duration - audio.buffered.end(buffer-1)) <1) {
                        bufferDom.style.width = w + 'px';
                        //me.musicDom.curThumb.style.left = w + 'px';
                        clearInterval(bufferTimer);
                    }
                }
            },1000);
        },
        /*重载播放器
        @param idx
        */
        resetPlayer : function(idx) {
            (idx >= (this.musicLength-1)) && (idx = (this.musicLength-1));
            (idx <= 0) && (idx = 0);
            this.currentMusic = idx;
            var nowMusic = this.musicList[idx],  //获取当前的播放音乐信息
                me = this;
            //过渡函数，用于事件监听和移除，暂时性的解决通过addEventListener添加的事件传递匿名函数无法移除的问题
            var tempBuffer = function(){
                return me.setBuffer(this,me.musicDom.bufferProcess);
            };
            //在canplay事件监听前移除之前的监听
            this.audioDom.removeEventListener('canplay',tempBuffer,false);
            clearInterval(bufferTimer);
            //样式重置(元素属性重新设置)
            this.musicDom.bufferProcess.style.width = 0 + 'px';
            this.musicDom.curProcess.style.width = 0 + 'px';
            this.audioDom.src = nowMusic.src;
            this.musicDom.cover.innerHTML = '<img src="'+nowMusic.cover+'" title="'+nowMusic.title+' -- '+ nowMusic.singer +'">';
            this.musicDom.title.innerHTML = '<a class="song">'+nowMusic.title+'</a><span><a>-'+nowMusic.singer+'</a></span><span class="time"></span>';
            this.musicDom.bigCover.innerHTML = '<img src="'+nowMusic.cover+'" title="'+nowMusic.title+' -- '+ nowMusic.singer +'">';
            this.musicDom.bgCover.style.backgroundImage = "url("+nowMusic.cover+")";
            this.musicDom.bigTitle.innerHTML = '<h2 class="song">'+nowMusic.title+'</h2><a>歌手:'+nowMusic.singer+'</a><a>专辑:'+nowMusic.album+'</a>';
            me.musicDom["lyricWrap"].innerHTML = '<li class="eof">正在加载歌词...</li>';
            me.musicDom["lyricWrap"].style.marginTop = 0 + "px";
            me.musicDom["lyricWrap"].scrollTop = 0;
            this.getLyric(idx);
            //设置播放列表选中
            var playlist = document.querySelectorAll('.m-music-list-wrap li');
            for (var i = 0; i < this.musicLength; i++) {
                if (i == idx) {
                    addClass(playlist[i],'current');
                } else {
                    removeClass(playlist[i],'current');
                }
            }
            //可以播放时，设置缓冲区，重新监听canplay  PS:当音频能够播放时，才会触发该事件
            this.audioDom.addEventListener('canplay',tempBuffer,false);
            if (this.config.autoPlay) { //增加是否启动就播放开关
                this.play();
            } else {
                this.pause();
            }
            var _callback = nowMusic;
            _callback.index = idx;
            typeof this.config.callback == "function" && this.config.callback(_callback);   //将当前播放信息回调
        },
        /*设置音量*/
        setVolume : function(volume) {
            var v = this.musicDom.volume,
                h = v.volumeEventer.offsetHeight || 70;  //隐藏元素的高度不好获取，这里设置visible来实现同样的效果
            if(volume <= 0) volume = 0;
            if(volume >= 1) volume = 1;
            this.audioDom.volume = volume;
            var currentHeight = h * volume;
            v.volumeCurrent.style.height = currentHeight + 'px';
            v.volumeCtrlBar.style.bottom = currentHeight + 'px';
            v.volumeProcess.setAttribute('data-volume',volume);
            if (volume == 0) {
                //静音
                addClass(v.volumeControl,'muted');
                this.audioDom.muted = true;
            } else {
                removeClass(v.volumeControl,'muted');
                this.audioDom.muted = false;
            }
        },
        /*初始化播放器*/
        initPlay : function(){
            var idx = this.config.defaultIndex;
            //console.log(idx);
            if(this.playMode == 2) { //随机播放
                idx = this.getRandomIndex();
            }
            this.setVolume(this.config.defaultVolume);
            this.audioDom.load();
            this.resetPlayer(idx);
        },
        //播放
        play : function(){
            var ctrl = this.musicDom.button.ctrl;
            this.audioDom.play();
            removeClass(ctrl,'paused');
            addClass(ctrl,'play');
            ctrl.setAttribute('title','暂停');
        },
        //暂停
        pause : function() {
            var ctrl = this.musicDom.button.ctrl;
            this.audioDom.pause();
            removeClass(ctrl,'play');
            addClass(ctrl,'paused');
            ctrl.setAttribute('title','播放');
        },
        /*//获取不包含当前索引的随机索引*/
        getRandomIndex : function(){
            var idx = this.currentMusic,len  = this.musicLength, i = 0, temp = [];
            //应该在不包括当前的列表中播放
            for(i;i<len;i++){
                if(i != idx){
                    temp.push(i);
                }
            }
            var random = parseInt(Math.random() * temp.length);
            return temp[random];
        },
        //通过播放模式加载歌曲并播放
        playByMode : function(type) {
            var modes = this.playMode,
                idx = this.currentMusic,
                len = this.musicLength,
                index = idx;
                //console.log(modes);
            if (modes == 1) { //列表
                if (type == 'prev') {
                    index = ((idx <= len -1) && (idx >0)) ? (idx-1) : (len-1);
                } else if(type == 'next' || type == 'ended') { //增加一个ended区别单曲循环
                    index = (idx >= len -1) ? 0 : (idx+1);
                }
            } else if (modes == 2) { //随机
                index = this.getRandomIndex();
            } else if (modes == 3) { //单曲
                    index = idx;
            }
            this.resetPlayer(index);
        },

        //一些操作
        action : function() {
            var me = this, v = this.musicDom.volume,btn = this.musicDom.button;
            //监听timeupdate，设置进度，PS:播放过程中，当前播放位置改变时，会触发该事件
            this.audioDom.addEventListener('timeupdate',function() {
                var audio = this;
                if (!isNaN(audio.duration)) {
                    var surplusTime = calcTime(audio.currentTime),
                        totalTime = calcTime(audio.duration);
                    var currentProcess = (audio.currentTime / audio.duration)*(me.musicDom.bufferProcess.parentNode.offsetWidth);
                    //当前播放时间/总时间 = 播放百分比
                    //播放百分比 * 进度条长度 = 当前播放进度
                    me.musicDom.time.innerHTML = ''+surplusTime+'/'+totalTime+'';
                    me.musicDom.curProcess.style.width = currentProcess + 'px';
                    me.musicDom.curThumb.style.left = currentProcess + 'px';
                    //歌词滚动
                    //设置歌词
                    var curTime = parseInt(audio.currentTime*1e3);
                    var lyrics  = me.musicDom["lyricWrap"].querySelectorAll(".u-lyric"),
                        sizes   = lyrics.length,
                        i       = 0;
                    if(sizes > 1){
                        for(;i < sizes ; i++){
                            var lyl = lyrics[i];
                            if(lyl){
                                var _time = parseFloat(lyl.getAttribute("data-time"));
                                if(curTime >= _time){
                                    var top = (i-1) * 40; //40是每个LI的高度
                                    me.musicDom["lyricWrap"].style.marginTop = -top + "px";
                                    //移除之前的current，想念Jquery的siblings
                                    for(var j = 0 ; j < sizes ;j++){
                                        lyrics[j] && removeClass(lyrics[j],"current");
                                    }
                                    addClass(lyl,"current"); //给当前行加上current
                                }
                            }
                        }
                    }
                }
            },false);
            //监听 播放结束，PS:当音频播放完毕或者播放结束时会触发ended事件
            this.audioDom.addEventListener('ended',function(){
                me.playByMode('ended');
            },false);
            //显示隐藏音量控制器，静音等操作
            v.volumeControl.addEventListener('click',function(event) {
                event = event || window.event;
                event.stopPropagation(); //不再派发
                if (hasClass(v.volumeBox,'show')) {
                    toggleClass(this,'muted');
                    hasClass(this,'muted') ? (me.audioDom.muted = true) : (me.audioDom.muted = false);
                } else {
                    addClass(v.volumeBox,'show');  //显示
                }
            },false);
            //区域外点击隐藏控制器
            document.addEventListener('click',function(event){
                event = event || window.event;
                event.stopPropagation();
                var target = event.target || event.srcElement;
                if ((target.parentNode !== v.volumeBox) && target.parentNode !== $('.left_footer .volume')) {
                    //当触发事件的元素不在音量元素范围里时关闭
                    removeClass(v.volumeBox,'show');
                }
            },false);
            //音量控制
            v.volumeEventer.addEventListener('click',function(event){
                event = event || window.event;
                event.stopPropagation();
                var h = this.offsetHeight,
                    y = event.offsetY,  //获取距离父级相对位子
                    volume = (h-y) /h;
                me.setVolume(volume);
            },false);
            //点击列表切歌
            var playlist = document.querySelectorAll('.m-music-list-wrap li');
            for (var i = 0; i < this.musicLength; i++) {
                !(function(i){
                    playlist[i].addEventListener('click',function() {
                        me.resetPlayer(i);
                    },false);
                }(i));
            }
            //暂停/播放
            btn.ctrl.addEventListener('click',function() {
                if (hasClass(this,'play')) {
                    me.pause();
                } else {
                    me.play();
                }
            },false);
            //上一曲
            btn.prev.addEventListener('click',function() {
                me.playByMode('prev');
            },false);
            //下一曲
            btn.next.addEventListener('click',function() {
                me.playByMode('next');
            },false);
            //模式选择
            //列表循环
            btn.listCircular.addEventListener('click',function() {
                if (hasClass(this,'list-circular')) {
                    removeClass(this,'list-circular');
                    addClass(this,'random-play');
                    me.playMode = 2;
                    //doing
                } else if (hasClass(this,'random-play')) {
                    removeClass(this,'random-play');
                    addClass(this,'single-circular');
                    me.playMode = 3;
                } else {
                    removeClass(this,'single-circular');
                    addClass(this,'list-circular')
                    me.playMode = 1;
                }
                /*addClass(this,'current');
                removeClass(btn.singleCircular,'current');
                removeClass(btn.randomPlay,'current');
                me.playMode = 1;*/
            });
            //显示歌曲列表
            btn.playlist.addEventListener('click',function(){
                if (hasClass(me.musicDom.listWrap,'show')) {
                    removeClass(me.musicDom.listWrap,'show');
                } else {
                    addClass(me.musicDom.listWrap,'show');
                }
            });
            //显示进度条调控原点
            me.musicDom.curProcess.addEventListener('mouseover',function() {
                addClass(me.musicDom.curThumb,'show');
            });
            me.musicDom.curProcess.addEventListener('mouseout',function() {
                removeClass(me.musicDom.curThumb,'show');
            });
            //点击歌曲小图片显示歌曲详细信息
            me.musicDom.songDetail.addEventListener('click',function(){
                var Song_details =$('.music-container .Song_details');
                if (hasClass(Song_details,'show')) {
                    removeClass(Song_details,'show');
                } else {
                    addClass(Song_details,'show');
                }
            });

            //拖动进度条，快进
            var $progress = this.musicDom["curProcess"].parentNode;
            $progress.addEventListener('click',function(e){
                e = e || window.event;
                //getBoundingClientRect()返回一个矩形对象
                var left = this.getBoundingClientRect().left,
                    width = this.offsetWidth;
                var progressX = Math.min(width,Math.abs(e.clientX-left)); //防止超出范围
                if(me.audioDom.currentTime && me.audioDom.duration) {
                    me.audioDom.currentTime = parseInt((progressX/width)*(me.audioDom.duration)); //重新设置播放进度
                }
            });

        },
        /**
         * 加载歌词
         * 目前只支持UTF8编码
         * 不支持跨域，如果要跨域则自行更改ajax为jsonp
         * @param index
         */
         getLyric : function(index) {
             if (this.lyricCache[index]) {
                 this.renderLyric(this.lyricCache[index]);
             } else {
                 var url = this.musicList[index]["lyric"],
                    me = this;
                if (url) {
                    ajax(url,function(data){
                        me.lyricCache[index] = data ? data : null;
                        me.renderLyric(data);
                    });
                } else {
                    this.lyricCache[index] = null;
                    me.renderLyric(null);
                }
             }
         },
         /**
         * 解析歌词
         * 歌词按时间分组并存储到数组
         * [{content: "车站 (Live) - 李健↵",time: 800}...]
         * @param lyric
         * @returns {*}
         */
        parseLyric : function (lyric) {
            if(!lyric) return lyric;
            var result = [];
            var cArr = lyric.split("[");
            cArr.shift();
            for (var i = 0; i < cArr.length; i++) {
                var o = cArr[i].split("]");
                if (o.length >= 2 && o[1] != "") {
                    var tArr = o[0].split(":"), t = 0;
                    if (tArr.length >= 2) {
                        var mtArr = tArr[0].split(""), mt = 0;
                        for (var k = 0; k < mtArr.length; k++) {
                            if (Number(mtArr[k]) > 0) {
                                mt += mtArr[k] * Math.pow(10, mtArr.length - k - 1);
                            }
                        }
                        t += mt * 60;
                        var stArr = tArr[1].split("."), intStArr = stArr[0].split(""), st = 0;
                        for (var j = 0; j < intStArr.length; j++) {
                            if (Number(intStArr[j]) > 0) {
                                st += intStArr[j] * Math.pow(10, intStArr.length - j - 1);
                            }
                        }
                        t += Number(st + "." + stArr[1]);
                    }
                    if(t && typeof t == "number"){
                        result.push({time : parseInt(t * 1e3), content : o[1]});
                    }
                }
            }
            return result;
        },
        /**
         * 渲染歌词
         * @param lyric
         */
        renderLyric : function (lyric) {
            lyric = this.parseLyric(lyric);
            var me = this, dom = me.musicDom["lyricWrap"], tpl = "",len, i = 0;
            len = lyric ? lyric.length : 0;
            if(lyric && len){
                for( i ; i < len ; i ++){
                    var data = lyric[i];
                    var time = data["time"], text = data["content"].trim();
                    text = text ? text : '              ';
                    tpl += '<li class="u-lyric f-toe" data-time="'+time+'">'+text+'</li>';
                }
                tpl && (tpl += '');
            }else{
                tpl = '<li class="eof">暂无歌词...</li>';
            }
            dom.style.marginTop = 0 + "px";
            dom.screenTop = 0;
            dom.innerHTML = tpl;
        },
        /**
         * 初始化播放器
         */
         init : function(){
             //缓存DOM结构
             this.musicDom = {
                 music : $('.music-container'),
                 cover : $('.music-container .u-cover'),
                 title : $('.music-container .u-music-title'),
                 bigCover : $('.music-container .b-cover'),
                 bgCover : $('.music-container .bgimg'),
                 bigTitle : $('.music-container .b-music-title'),
                 curProcess : $('.music-container .current-process'),
                 bufferProcess : $('.music-container .buffer-process') ,
                 time : $('.music-container .time'),
                 listWrap : $('.music-container .m-music-list-wrap'),
                 lyricWrap : $('.music-container .js-music-lyric-content'), //歌词区域
                 curThumb : $('.music-container .cur_thumb'),  //歌曲进度条原点
                 songDetail : $('.music-container .mask'),   //点击歌曲小图获得歌曲歌词和大图
                 volume : {
                     volumeBox : $('.music-container .volume-box'),
                     volumeProcess : $('.music-container .volume'),
                     volumeCurrent : $('.music-container .volume-current'),
                     volumeCtrlBar : $('.music-container .volume-bar'),
                     volumeEventer : $('.music-container .volume-event'),
                     volumeControl : $('.music-container .volume-control')
                 },
                 button : {
                     ctrl : $('.music-container .ctrl-play'),
                     prev : $('.music-container .prev'),
                     next : $('.music-container .next'),
                     listCircular : $('.music-container .list-circular'),  ////列表循环
                     singleWords : $(".music-container .Lyric-word"), //歌词
                     playlist : $('.music-container .Playlist')
                 }
             };
             this.currentMusic = this.config.defaultIndex || 0;
             this.playMode = this.config.defaultMode || 1; //播放模式，默认列表循环
             this.lyricCache = {}; //缓存已加载的歌词文件
             this.audioDom = document.createElement('audio');
             this.createListDom();
             this.initPlay();
             this.action();
         }
    };
    win = win || window;
    //重新封装，实例化后返回一个全局对象
    win.SMusic = function(options) {
        return new SmMusic(options);
    };
})(window);
