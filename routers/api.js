/**
 * Created by Administrator on 2017/3/4.
 */
//路由操作
//第一步：引入基于nodejs的web应用开发框架  express模块
var express=require("express");
var mysql=require("mysql");
var pool=mysql.createPool({
    host:"127.0.0.1",
    port:3306,
    database:"blog",
    user:"root",
    password:"aaaa"
});

//第二步：加载路由
var router=express.Router();

var resData;
//定义一下统一返回的json格式
router.use(function(req,res,next){
    resData={
        code:-1,
        msg:""
    };
    next();
});

//注册
router.post("/user/register",function (req,res) {
    //获取传过来的参数
    var uname=req.body.uname;
    var pwd=req.body.pwd;

    pool.getConnection(function (err,conn) {
        //查重，查找用户名是否重名
        conn.query("select * from user where uname=?",[uname],function (err,result) {
            if(err){
                resData.code=0;
                resData.msg="网络连接失败，请稍候再试";
                res.json(resData);   //服务器要求返回json，因此这里也返回json数据格式的
            }else if(result.length>0){
                resData.code=1;
                resData.msg="用户名已存在，请重新注册";
                res.json(resData);
            }else{
                //可以注册
                conn.query("insert into user values(null,?,?,0)",[uname,pwd],function (err,result) {
                    conn.release();
                    if(err){
                        resData.code=0;
                        resData.msg="网络连接失败，请稍候再试";
                        res.json(resData);
                    }else{
                        resData.code=2;
                        resData.msg="注册成功";
                        res.json(resData);
                    }
                });
            }
        });
    });
});


//登陆
router.post("/user/login",function (req,res,next) {
    //获取传过来的参数
    var uname=req.body.uname;
    var pwd=req.body.pwd;

    pool.getConnection(function (err,conn) {
        if(err){
            resData.code=0;
            resData.msg="网络连接失败，请稍候再试";
            res.json(resData);
        }else{
            conn.query("select * from user where uname=? and pwd=?",[uname,pwd],function (err,result) {
                conn.release();
                if(err){
                    resData.code=0;
                    resData.msg="网络连接失败，请稍候再试";
                    res.json(resData);
                }else if(result.length<=0){
                    resData.code=1;
                    resData.msg="用户名或者密码错误，请验证后再试";
                    res.json(resData);
                }else{
                    resData.code=2;
                    resData.msg="登陆成功";
                    resData.info=result[0];    //传输到前台，好获取用户名

                    req.session.user={
                        _id:result[0].uid,
                        uname:result[0].uname,
                        isAdmin:result[0].isAdmin
                        //存session
                    };
                    res.json(resData);
                }
            });
        }
    });
});

//退出登陆
router.get("/user/logout",function (req,res) {
    //其实就是删除session
    delete req.session.user;
    resData.code=0;
    res.json(resData);
});

//添加评论
router.post("/comment/post",function (req,res) {
    var cid=req.body.contentid;
    //协议 只是程序员为了方便存数据，约定好什么符号是什么意思
            //因为我们要在一个字段里面存三个信息
    var postData=req.session.user.uname+","+new Date()+","+req.body.content+";";
    //console.log(postData);
    pool.getConnection(function (err,conn) {   //concat mysql里面的函数 累加
        conn.query("update contents set comments=CONCAT(comments,?) where cid=?",[postData,cid],function (err,result) {
            conn.release();
            if(err){
                resData.code=0;
                resData.msg="网络连接失败，请稍后重试";
                res.json(resData);
            }else{
                resData.code=1;
                resData.msg="评论成功";
                res.json(resData);
            }
        });
    });
});


//第三步：把这个路由的文件和主模块连接起来
module.exports=router;