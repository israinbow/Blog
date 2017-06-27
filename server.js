/**
 * Created by Administrator on 17-3-4.
 */
var mysql=require("mysql");
var fs=require("fs");      //文件系统
var express=require("express");     //基于nodejs的web应用开发框架
var cookieParser=require("cookie-parser");    //express的中间件，用于获取web浏览器发送的cookie中的内容
var bodyParser=require("body-parser");  //express的中间件,用于解析客户端请求的body中的内容,内部使用JSON编码处理,url编码处理以及对于文件的上传处理
var multer=require("multer");  //express的中间件,处理multipart/form-data数据格式(用在上文件传功能中）
//session:会话   从打开浏览器，访问这个页面开始，然后一直到关闭浏览器
var session=require("express-session");

//加载模版引擎
var swig=require("swig");

//创建web程序入口
var app=express();


//配置模版引擎    配置文件后缀名，以及你的模版引擎渲染文件的方法
app.engine("html",swig.renderFile);   //后缀名 处理模版引擎渲染的方法
//设置模版引擎所放的目录
app.set("views","./view");   //不可变  目录
//注册所使用的模版引擎
app.set("view engine","html");   //不可变 为app.engine这个方法所定义的东西

//模版引擎默认记住缓存，开发可以不记住缓存，上线了就必须
swig.setDefaults({cache:false});

//静态资源托管
app.use("/public",express.static(__dirname + "/public") );


//配置
app.use(bodyParser.urlencoded({extended:false}));    //配置bodyParser
//第一步：cookie的运行
app.use(cookieParser());


//第二步：session的配置
app.use(session({
    secret:"keyboard cat",    //session私密id
    resave:true,              //每次请求，都会重新去设置session cookie
    saveUninitialized:true,   //指无论有没有session cookie，每次请求都会自动添加一个
    cookie:{secure:false},     //https协议  http协议
    cookie:{maxAge:1000*600}   //毫秒为单位,过了这个时间session就没有了
}));

var pool=mysql.createPool({
    host:"127.0.0.1",
    port:3306,
    database:"blog",
    user:"root",
    password:"aaaa"
});


//考虑到如果所有的业务逻辑都是写到这个server.js里面，那么此文件将过于庞大，因此，我们分模块开发
//定义路由的路径   默认都是引入js文件，因此不需要后缀名
app.use("/admin",require("./routers/admin"));   //后台管理模块
app.use("/api",require("./routers/api"));       //前台管理模块
app.use("/",require("./routers/main"));         //公共功能模块


app.listen(80,function(err){
    if(err){
        console.log(err);
    }else{
        console.log("服务器启动成功");
    }
});