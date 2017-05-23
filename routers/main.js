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
    database:"myblog",
    user:"root",
    password:"aaaa"
});

//第二步：加载路由
var router=express.Router();

var data={};
//每一次查询都要用到导航栏，因此，我们干脆查一次，然后保存到全局变量
router.use(function (req,res,next) {
    pool.getConnection(function (err,conn) {
        conn.query("select * from type order by tid",function (err,result) {
            conn.release();
            data.type=result;
            next();
        });
    });
});

router.get("/",function (req,res,next) {
    //确保绝对是从第一页开始的
    //console.log( typeof(req.query.page) );      //字符串类型
    var page=Number(req.query.page || 1);
    var size=3;    //默认每一页的数据为7

    //获取所有的用户信息
    pool.getConnection(function (err,conn) {
        conn.query("select c.*,t.tname from contents c,type t where c.tid=t.tid",function (err,result) {
                var count=result.length;
                var pages=Math.ceil(count/size);  //向下取整求得总页数

                //控制一下页数
                page=Math.min(page,pages);
                page=Math.max(page,1);

                //还要查一次数据库                                0-6    7-13     14-20
                conn.query("select c.*,t.tname,u.uname from contents c,type t,user u where c.tid=t.tid and c.uid=u.uid order by cid limit ?,?",
                    [size*(page-1),size],function (err,result) {
                        conn.release();
                        if(err || result.length<=0){
                            result={};
                        }else{
                            //第一个参数:模版的路径  第二个参数:分配给模版使用的数据
                            res.render("main/index",{
                                userInfo:req.session.user,
                                categories:data.type,
                                contents:result,
                                tag:"content",
                                page:page,
                                pages:pages,
                                count:count,
                                size:size
                            });
                        }
                    });
            });
    });
});

router.get("/view",function (req,res) {
    var cid=req.query.contentid;
    pool.getConnection(function(err,conn){
        conn.query("select c.*,u.uname from contents c,user u where c.uid=u.uid and c.cid=?", [cid],function (err,result) {
            conn.release();

            //处理一下你的评论的信息
            var mycomments=result[0].comments.split(";");
            var comments=[];
            var mydata={};
            //attention
            for(var i=0;i<mycomments.length-1;i++){
                mydata.uname=mycomments[i].split(",")[0];
                mydata.ttime=mycomments[i].split(",")[1];
                mydata.content=mycomments[i].split(",")[2];
                comments.push(mydata);
                mydata={};
            };
            //数组倒叙
            comments.reverse();

            result[0].comments=comments.length;

            res.render("main/view",{
                userInfo:req.session.user,
                content:result[0],
                categories:data.type,
                tid:result[0].tid,
                comments:comments
            });
        });
    });
});

//第三步：把这个路由的文件和主模块连接起来
module.exports=router;