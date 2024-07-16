<template>
<q-layout view="hHh lpr fff" ref="cadCapture" data-nosnippet>
    <q-header style="background:#002A50;">
        <q-toolbar>
            <q-toolbar-title :shrink="true" >DXF viewer</q-toolbar-title>
            <q-file color="white" label-color="white" filled bottom-slots clearable dense
                    :value="inputFile" label="Select file or drag here" style="max-width: 600px;"
                    accept=".dxf"
                    class="q-ml-xl" dark @input="_OnFileSelected" @clear="_OnFileCleared">
                <template v-slot:before>
                    <q-icon name="folder_open" color="white" />
                </template>
                <template v-slot:hint>
                    <!-- <span class="text-white">File is processed locally in your browser</span> -->
                </template>
                <template v-slot:after>
                    <q-btn-group>
                        <q-btn dense flat label="이미지로 내보내기" @click="_StartCapture" style="background:rgba(255,255,255,0.07); color:white;"/>
                        <q-btn dense flat label="흑백이미지로 내보내기" @click="_grayScaleCapture" style="background:rgba(255,255,255,0.07); color:white; margin-left:15px;"/>
                    </q-btn-group>
                    <a id="target" style="display: none"></a>
                </template>
            </q-file>
            <q-space />
        </q-toolbar>
    </q-header>
    <q-page-container>
        <ViewerPage :dxfUrl="dxfUrl">
            <div v-if="inputFile === null"
                 class="centralUploader row justify-center items-center" >
                <div class="col-auto" style="width: 300px;">
                    <q-file filled bottom-slots clearable
                            :value="inputFile" label="Select file or drag here"
                            accept=".dxf"
                            class="col" @input="_OnFileSelected" @clear="_OnFileCleared">
                        <template v-slot:before>
                            <q-icon name="folder_open" size="xl" />
                        </template>
                        <template v-slot:hint>
                            <span>File is processed locally in your browser</span>
                        </template>
                    </q-file>
                </div>
            </div>
        </ViewerPage>
    </q-page-container>

    <!-- <q-dialog v-model="aboutDialog">
        <q-card>
            <q-card-section class="row items-center q-pb-sm">
                <div class="text-h6">About</div>
                <q-space />
                <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>
            <q-separator />
            <q-card-section style="max-height: 50vh" class="scroll" v-html="aboutHtml" />
        </q-card>
    </q-dialog> -->

    <q-dialog v-model="urlDialog">
        <q-card>
            <q-card-section class="row items-center q-pb-sm">
                <div class="text-h6">Load URL</div>
                <q-space />
                <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>
            <q-separator />
            <q-card-section>
                <div class="q-mb-lg">
                    <a href="https://startpage.com/sp/search?q=SECTION%20HEADER%20filetype:dxf"
                       target="_blank">Find some examples</a>
                </div>
                <q-form @submit="_OnUrl" class="q-gutter-md" style="width: 400px;">
                    <q-input filled v-model="inputUrl" label="Input URL here" bottom-slots>
                      <template v-slot:hint>
                        <span>Uses <a href="https://allorigins.win">AllOrigins</a> CORS proxy</span>
                      </template>
                    </q-input>
                    <div>
                        <q-btn label="Submit" type="submit" color="primary" v-close-popup />
                    </div>
                </q-form>
            </q-card-section>
        </q-card>
    </q-dialog>
</q-layout>
</template>
<script>
import ViewerPage from "@/components/ViewerPage";
import html2canvas from "html2canvas"
import * as three from "three"

export default {
    components: {ViewerPage},

    data() {
        return {
            dxfUrl: null,
            inputFile: null,
            isLocalFile: false,
            aboutDialog: false,
            urlDialog: false,
            inputUrl: null
        }
    },

    methods: {
        async fetchFileFromServer(url) {
            try {
                console.log("fetchFileFromServer");
                //url = "http://localhost:10010/disaster-rest/file/test.dxf";
                const response = await fetch(url);
                const blob = await response.blob();
                const file = new File([blob], "test.dxf", { type: "application/dxf" });
                this._OnFileSelected(file);
            } catch (error) {
                console.error("Error fetching file from server:", error);
            }
        },
        _OnFileSelected(file) {
        console.log("file : ",file);
            if (!file) {
                this._OnFileCleared()
                return
            }
            if (this.dxfUrl && this.isLocalFile) {
                console.log("this.dxfUrl : ",this.dxfUrl);
                URL.revokeObjectURL(this.dxfUrl)
            }
            this.isLocalFile = true
            this.inputFile = file
            this.dxfUrl = URL.createObjectURL(file)
        },

        _OnFileCleared() {
            if (this.inputFile) {
                this.inputFile = null
                URL.revokeObjectURL(this.dxfUrl)
                this.dxfUrl = null
                this.$q.notify({
                    type: "info",
                    message: "File cleared"
                })
            }
        },

        _OnUrl() {
            if (this.inputUrl === null) {
                return
            }
            const url = this.inputUrl.trim()
            if (url === "") {
                return
            }
            if (this.dxfUrl && this.isLocalFile) {
                URL.revokeObjectURL(this.dxfUrl)
            }
            this.isLocalFile = false
            this.inputFile = new File(["remote_file"], url, { type: "text/plain" })
            this.dxfUrl = "https://api.allorigins.win/raw?url=" + encodeURIComponent(url)
        },

        _StartCapture(e) {
            console.log("캡쳐 클릭");
            document.querySelector("body").classList.add("edit_cursor");

            screenshot(e);

            function screenshot(e){
            var startX, startY;
            var height = window.innerHeight;
            var width = window.innerWidth;

            // 배경을 어둡게 깔아주기 위한 div 객체 생성
            var $screenBg = document.createElement("div");
            $screenBg.id = "screenshot_background";
            $screenBg.style.borderWidth = "0 0 " + height + "px 0";

            // 마우스 이동하면서 선택한 영역의 크기를 보여주기 위한 div 객체 생성
            var $screenshot = document.createElement("div");
            $screenshot.id = "screenshot";

            document.querySelector("body").appendChild($screenBg);
            document.querySelector("body").appendChild($screenshot);

            var selectArea = false;
            var body = document.querySelector('body');

            // 마우스 누르는 이벤트 함수
            var mousedown = function(e) {
                e.preventDefault();
                selectArea = true;
                startX = e.clientX;
                startY = e.clientY;
                // 이벤트를 실행하면서 이벤트 삭제 (한번만 동작하도록)
                body.removeEventListener("mousedown", mousedown);
            }
            // 마우스 누르는 이벤트 등록
            body.addEventListener("mousedown", mousedown);

            // 클릭한 마우스 떼는 이벤트 함수
            var mouseup = function(e) {
                selectArea = false;
                // (초기화) 마우스 떼면서 마우스무브 이벤트 삭제
                body.removeEventListener("mousemove", mousemove);
                // (초기화) 스크린샷을 위해 생성한 객체 삭제
                $screenshot.parentNode.removeChild($screenshot);
                $screenBg.parentNode.removeChild($screenBg);
                var x = e.clientX;
                var y = e.clientY;
                var top = Math.min(y, startY);
                var left = Math.min(x, startX);
                var width = Math.max(x, startX) - left;
                var height = Math.max(y, startY) - top;
                
                html2canvas(document.body).then(
                    function(canvas) { //전체 화면 캡쳐
                        var img = canvas.getContext('2d').getImageData(left, top, width, height);
                        var c = document.createElement("canvas");
                        var ctx = c.getContext('2d');

                        c.width = width;
                        c.height = height;

                        c.getContext('2d').putImageData(img, 0, 0);
                        save(c);

                    }
                );
                body.removeEventListener("mouseup", mouseup);
                // 마우스 커서 기본으로 변경
                document.querySelector("body").classList.remove("edit_cursor");
            }
            body.addEventListener("mouseup", mouseup);

            // 마우스무브 이벤트 함수
            function mousemove(e) {
                var x = e.clientX;
                var y = e.clientY;
                $screenshot.style.left = x + 'px';
                $screenshot.style.top = y + 'px';
                if (selectArea) { //캡쳐 영역 선택 그림
                    var top = Math.min(y, startY);
                    var right = width - Math.max(x, startX);
                    var bottom = height - Math.max(y, startY);
                    var left = Math.min(x, startX);
                    $screenBg.style.borderWidth = top + 'px ' + right + 'px ' + bottom + 'px ' + left + 'px';
                }
            }
            body.addEventListener("mousemove", mousemove);

            // 캡쳐한 이미지 저장
            function save(canvas) {
                if (navigator.msSaveBlob) {
                    console.log("blob");
                    var blob = canvas.msToBlob();
                    return navigator.msSaveBlob(blob, '파일명.jpg');
                } else {




                    // 동적으로 a 요소 생성
                    var link = document.createElement('a');
                    link.href = canvas.toDataURL("image/jpeg");
                    link.download = '파일명.jpg';
                    
                    // a 요소를 DOM에 추가
                    document.body.appendChild(link);
                    
                    // 클릭 이벤트 트리거
                    link.click();
                    
                    // a 요소를 DOM에서 제거
                    document.body.removeChild(link);
                }
            }
        }
        },
        _grayScaleCapture(e) {
            console.log("캡쳐 클릭");
            document.querySelector("body").classList.add("edit_cursor");

            screenshot(e);

            function screenshot(e){
            var startX, startY;
            var height = window.innerHeight;
            var width = window.innerWidth;

            // 배경을 어둡게 깔아주기 위한 div 객체 생성
            var $screenBg = document.createElement("div");
            $screenBg.id = "screenshot_background";
            $screenBg.style.borderWidth = "0 0 " + height + "px 0";

            // 마우스 이동하면서 선택한 영역의 크기를 보여주기 위한 div 객체 생성
            var $screenshot = document.createElement("div");
            $screenshot.id = "screenshot";

            document.querySelector("body").appendChild($screenBg);
            document.querySelector("body").appendChild($screenshot);

            var selectArea = false;
            var body = document.querySelector('body');

            // 마우스 누르는 이벤트 함수
            var mousedown = function(e) {
                e.preventDefault();
                selectArea = true;
                startX = e.clientX;
                startY = e.clientY;
                // 이벤트를 실행하면서 이벤트 삭제 (한번만 동작하도록)
                body.removeEventListener("mousedown", mousedown);
            }
            // 마우스 누르는 이벤트 등록
            body.addEventListener("mousedown", mousedown);

            // 클릭한 마우스 떼는 이벤트 함수
            var mouseup = function(e) {
                selectArea = false;
                // (초기화) 마우스 떼면서 마우스무브 이벤트 삭제
                body.removeEventListener("mousemove", mousemove);
                // (초기화) 스크린샷을 위해 생성한 객체 삭제
                $screenshot.parentNode.removeChild($screenshot);
                $screenBg.parentNode.removeChild($screenBg);
                var x = e.clientX;
                var y = e.clientY;
                var top = Math.min(y, startY);
                var left = Math.min(x, startX);
                var width = Math.max(x, startX) - left;
                var height = Math.max(y, startY) - top;
                
                html2canvas(document.body).then(
                    function(canvas) { //전체 화면 캡쳐
                        var img = canvas.getContext('2d').getImageData(left, top, width, height);
                        var c = document.createElement("canvas");
                        var ctx = c.getContext('2d');

                        c.width = width;
                        c.height = height;

                        c.getContext('2d').putImageData(img, 0, 0);
                        //save(c);

                        // gray scale 시작
                        var dataURL = c.toDataURL("image/jpeg"); 

                        var grayscaleCanvas = document.createElement("canvas"); 
                        var grayscaleCtx = grayscaleCanvas.getContext('2d'); 

                        grayscaleCanvas.width = width; 
                        grayscaleCanvas.height = height; 

                        var imgElement = new Image(); 
                        imgElement.onload = function() { 
                            grayscaleCtx.drawImage(imgElement, 0, 0); 
                            var imgData = grayscaleCtx.getImageData(0, 0, grayscaleCanvas.width, grayscaleCanvas.height); //*************
                            var data = imgData.data; 
                            for (var i = 0; i < data.length; i += 4) {
                                var grayscale = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11; //*************
                                data[i] = grayscale;     // red 
                                data[i + 1] = grayscale; // green 
                                data[i + 2] = grayscale; // blue
                            }
                            grayscaleCtx.putImageData(imgData, 0, 0); 
                            save(grayscaleCanvas); 
                        };
                        imgElement.src = dataURL; 
                        // gray scale 끝
                    }
                );
                body.removeEventListener("mouseup", mouseup);
                // 마우스 커서 기본으로 변경
                document.querySelector("body").classList.remove("edit_cursor");
            }
            body.addEventListener("mouseup", mouseup);

            // 마우스무브 이벤트 함수
            function mousemove(e) {
                var x = e.clientX;
                var y = e.clientY;
                $screenshot.style.left = x + 'px';
                $screenshot.style.top = y + 'px';
                if (selectArea) { //캡쳐 영역 선택 그림
                    var top = Math.min(y, startY);
                    var right = width - Math.max(x, startX);
                    var bottom = height - Math.max(y, startY);
                    var left = Math.min(x, startX);
                    $screenBg.style.borderWidth = top + 'px ' + right + 'px ' + bottom + 'px ' + left + 'px';
                }
            }
            body.addEventListener("mousemove", mousemove);

            // 캡쳐한 이미지 저장
            function save(canvas) {
                if (navigator.msSaveBlob) {
                    console.log("blob");
                    var blob = canvas.msToBlob();
                    return navigator.msSaveBlob(blob, '파일명.jpg');
                } else {




                    // 동적으로 a 요소 생성
                    var link = document.createElement('a');
                    link.href = canvas.toDataURL("image/jpeg");
                    link.download = '파일명.jpg';
                    
                    // a 요소를 DOM에 추가
                    document.body.appendChild(link);
                    
                    // 클릭 이벤트 트리거
                    link.click();
                    
                    // a 요소를 DOM에서 제거
                    document.body.removeChild(link);
                }
            }
        }
        }
    },

    created() {
        var url = window.location.protocol + "//" + window.location.host;
        var fileUrl = "";

        if(url == "https://rnd1.mapinus.com"){
            fileUrl = "https://rnd1.mapinus.com/disaster-rest/file/test.dxf";
        }else {
            fileUrl = "http://localhost:10010/disaster-rest/file/test.dxf";
        }

        this.fetchFileFromServer(fileUrl);
        //this.dxfUrl = "http://localhost:10010/disaster-rest/file/test.dxf";
        //const aboutBlock = document.getElementById("about")
        //this.aboutHtml = aboutBlock.innerHTML
        //aboutBlock.style.display = "none"
        /* For web crawler. */
        //document.getElementById("noscript").innerText = aboutBlock.innerText
    },
    destroyed() {
        if (this.dxfUrl) {
            URL.revokeObjectURL(this.dxfUrl)
        }
    }
}
</script>

<style scoped lang="less">

a.github:hover {
    text-decoration: none;
}

.centralUploader {
    width: 100%;
    height: 100%;
    position: absolute;
    z-index: 10;
}

</style>