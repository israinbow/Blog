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

var msg={
    code:0,
    message:""

};

router.get("/",function (req,res,next) {
    //使用模版引擎去渲染页面，两个参数： 路径 分配给这个页面使用的数据
    res.render('admin/index',{
        userInfo:req.session.user
    });
});

//用户管理首页，分页查询
router.get("/user",function (req,res) {
    //确保绝对是从第一页开始的
    //console.log( typeof(req.query.page) );      //字符串类型
    var page=Number(req.query.page || 1);
    var size=7;    //默认每一页的数据为7

    //获取所有的用户信息
    pool.getConnection(function (err,conn) {
        conn.query("select * from user",function (err,result) {
            var count=result.length;
            var pages=Math.ceil(count/size);  //向下取整求得总页数

            //控制一下页数
            page=Math.min(page,pages);
            page=Math.max(page,1);

            //还要查一次数据库                                0-6    7-13     14-20
            conn.query("select * from user limit ?,?",[size*(page-1),size],function (err,result) {
                conn.release();
                if(err){
                    result={};
                    res.render("admin/user_index",{
                        allUser:result
                    });
                }else{
                    res.render("admin/user_index",{
                        userInfo:req.session.user,
                        allUser:result,
                        tag:"user",
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

//添加分类
router.get("/type/add",function (req,res) {
    res.render("admin/type_add",{   //渲染网页
        userInfo:req.session.user,
    });
});

router.post("/type/add",function (req,res) {
    var name=req.body.name;
    if(name=="" || name==null){
        //跳转错误页面
    }else{
        pool.getConnection(function (err,conn) {
            conn.query("insert into type values(null,?)",[name],function (err,result) {
                if(err){
                    //console.log(err);
                    msg.code=1;
                    msg.message="类名不可重复，请重新添加";
                    res.send(msg);
                }else{
                    msg.code=2;
                    msg.message="添加成功";
                    res.send(msg);
                }
            });
        });
    }
});

//分类首页
router.get("/type",function (req,res) {
    //确保绝对是从第一页开始的
    //console.log( typeof(req.query.page) );      //字符串类型
    var page=Number(req.query.page || 1);
    var size=7;    //默认每一页的数据为7

    pool.getConnection(function (err,conn) {
        conn.query("select * from type",function (err,result) {
            var count=result.length;
            var pages=Math.ceil(count/size);  //向下取整求得总页数

            //控制一下页数
            page=Math.min(page,pages);
            page=Math.max(page,1);

            conn.query("select * from type order by tid limit ?,?",[size*(page-1),size],function (err,rs) {
                conn.release();
                if(err || rs.length<=0){
                    res.render("/admin/type_index",{
                        userInfo:req.session.user,
                        msg:"暂无信息"
                    });
                }else{
                    res.render("admin/type_index",{
                        userInfo:req.session.user,
                        categories:rs,
                        tag:"type",
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


//分类修改
router.post("/type/edit",function (req,res) {
    var id=req.body.tid;
    var tname=req.body.newname;
    pool.getConnection(function (err,conn) {
        conn.query("update type set tname=? where tid=?",[tname,id],function (err,result) {
            conn.release();
            if(err){
                console.log(err);
                msg.code=1;
                msg.message="网络连接失败，请稍后再试";
                res.send(msg);
            }else{
                msg.code=2;
                msg.message="修改成功";
                res.send(msg);
            }
        });
    });
});



//删除类别
router.get("/category/delete",function(req,res){
    var tid=Number(req.query.id);
    pool.getConnection(function (err,conn) {
        //万一，当内容里面有一个分类下面的文章，那就把要删除的那个分类下面的文章都放到首页去
        conn.query("update contents set tid=1 where tid="+tid,function (err,result) {
            if(err){
                res.send("<script>alert('网络连接失败，请稍后重试')</script>");
            }else{
                conn.query("delete from type where tid=?",[tid],function (err,rs) {
                    conn.release();
                    if(err){
                        console.log(err);
                        res.send("<script>alert('网络连接失败，请稍后重试')</script>");
                    }else{
                        res.send("<script>alert('删除成功');location.href='../type'</script>");
                    }
                });
            }
        });
    });
});


//内容首页
router.get("/content",function (req,res) {
    //确保绝对是从第一页开始的
    //console.log( typeof(req.query.page) );      //字符串类型
    var page=Number(req.query.page || 1);
    var size=7;    //默认每一页的数据为7

    pool.getConnection(function (err,conn) {
        conn.query("select c.*,t.tname from contents c,type t where c.tid=t.tid",function (err,result) {
            var count=result.length;
            var pages=Math.ceil(count/size);  //向下取整求得总页数

            //控制一下页数
            page=Math.min(page,pages);
            page=Math.max(page,1);
            var len=(page-1)*size;

            //分页，默认一页7条，从0开始取7条数据
            conn.query("select c.*,t.tname,u.uname from contents c,type t,user u where c.tid=t.tid and c.uid=u.uid order by cid limit ?,?",
                [len,size],function (err,rs) {
                conn.release();
                if(err || rs.length<=0){
                    res.render("admin/content_index",{
                        userInfo:req.session.user
                    });
                }else{
                    res.render("admin/content_index",{
                        contents:rs,
                        userInfo:req.session.user,
                        tag:"content",     //哪一个路由操作
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


//修改内容
router.get("/content/edit",function (req,res) {
   var cid=req.query.id;
    pool.getConnection(function (err,conn) {
        conn.query("select * from type order by tid",function (err,resu) {
            var categories=resu;
            conn.query("select c.*,t.tname from contents c,type t where c.tid=t.tid and cid=?",[cid],function (err,result) {
                if(!err){
                    conn.release();
                    res.render("admin/content_edit",{
                        userInfo:req.userInfo,
                        content:result[0],
                        categories:categories
                    });
                }
            });
        });
    });
});

//提交修改的内容
router.post("/content/edit",function(req,res){
    var tid=req.body.category;
    var title=req.body.title;
    var description=req.body.description;
    var content=req.body.content;
    var data=new Date();
    var addTime=data.getFullYear()+","+(data.getMonth()+1)+","+data.getDate()+
        " "+data.getHours()+":"+data.getMinutes()+":"+data.getSeconds()+":"+
        data.getMilliseconds();
    //修改数据类型 query查询的数据是string类型
    var cid=Number(req.query.id);

    pool.getConnection(function (err,conn) {
       conn.query("update contents set tid=?,title=?,description=?,content=?,addTime=? where cid=?",
           [tid,title,description,content,addTime,cid],function(err,result){
               //因为这个post请求，一定要有响应，因此无法直接渲染页面，只能利用location.href去跳转页面
               res.send("<script>alert('修改成功');location.href='./'</script>");
       })
    });
});

//删除内容
router.post("/content/del",function (req,res) {
    var cid=req.body.cid;
    pool.getConnection(function (err,conn) {
        conn.query("delete from contents where cid=?",[cid],function (err,result) {
            conn.release();
            if(err){
                msg.code=1;
                msg.message="网络连接错误，请稍后再试";
                res.json(msg);
            }else{
                msg.code=2;
                msg.message="删除成功";
                res.json(msg);
            }
        });
    });
});

//添加内容界面
router.get("/content/add",function (req,res) {
    pool.getConnection(function (err,conn) {
        conn.query("select * from type order by tid",function (err,result) {
            conn.release();
            res.render("admin/content_add",{
                userInfo:req.session.user,
                categories:result
            })
        });
    });
});


//添加内容，向服务器传递整个form表单的数据
router.post("/content/add",function (req,res) {
    var tid=req.body.category;
    var title=req.body.title;
    var des=req.body.description;
    var content=req.body.content;

    //console.log(req.session.user);

    var data=new Date();
    var addTime=data.getFullYear()+","+(data.getMonth()+1)+","+data.getDate()+
        " "+data.getHours()+":"+data.getMinutes()+":"+data.getSeconds()+":"+
            data.getMilliseconds();

    pool.getConnection(function (err,conn) {
        conn.query("insert into contents values(null,?,?,?,?,?,?,null)",
            [tid,req.session.user._id,title,addTime,des,content],function (err,result) {
            conn.release();
            if(!err){
                res.send("<script>alert('添加成功');location.href='./'</script>")
            }
        });
    });
});

//第三步：把这个路由的文件和主模块连接起来
module.exports=router;