module.exports = {
    publicPath: process.env.NODE_ENV === "production"
        //? "./dxf-view/"
        //? "./home_files/util/dxf/"
        ? "./"
        : "/",
    transpileDependencies: [
        /[\\\/]node_modules[\\\/]dxf-viewer[\\\/]/
    ],
    configureWebpack: require('./webpack.config.js'), // 웹팩 설정을 별도 파일로 분리
}
