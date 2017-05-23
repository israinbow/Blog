//首页首先显示登陆的窗口，点击注册的按钮显示注册窗口,注册用户名
$(function () {
    var $loginBox=$("#loginBox");
    var $registerBox=$("#registerBox");
    var $userInfo=$("#userInfo");

    //给登陆窗口下的注册按钮绑定点击事件
    $loginBox.find("a.colMint").on("click",function () {
        $loginBox.hide();
        $registerBox.show();
    });

    //给注册窗口下的登陆按钮绑定点击事件
    $registerBox.find("a.colMint").on("click",function () {
        $registerBox.hide();
        $loginBox.show();
    });



    //注册
    $registerBox.find("button").on("click",function () {
                                  //属性选择器，要找到登陆下的username再取值
        var uname=$registerBox.find("[name='username']").val();
        var pwd=$registerBox.find("[name='password']").val();
        var repwd=$registerBox.find("[name='repassword']").val();

        if(uname=="" || uname==null || pwd=="" || pwd==null || repwd=="" || repwd==null){
            alert("用户名或者密码不能为空");
            return;
        }
        if(pwd!==repwd){
            alert("两次输入的密码不一致，请重新输入");
            return;
        }
        $.ajax({
            type:"post",
            url:"/api/user/register",
            data:{
                uname:uname,
                pwd:pwd
            },
            dataType:"json",
            success:function (data) {
                if(data.code!=2){
                    alert(data.msg);
                }else{
                    $registerBox.find(".textRight").hide();
                    $registerBox.find(".colWarning").show();
                    //注册成功
                    setTimeout(function () {
                        //清空原先输入的注册信息
                        $registerBox.find("[name='username']").val("");
                        $registerBox.find("[name='password']").val("");
                        $registerBox.find("[name='repassword']").val("");
                        $registerBox.hide();
                        $loginBox.show();
                    },1000);
                }
            }
        });
    });

    //登陆
    $loginBox.find("button").on("click",function () {
        var uname=$loginBox.find("[name='username']").val();
        var pwd=$loginBox.find("[name='password']").val();
        if(uname=="" || uname==null || pwd=="" || pwd==null){
            alert("用户名或者密码不能为空");
            return;
        }

        //通过ajax提交请求
        $.ajax({
            type:"post",
            url:"/api/user/login",
            data:{
                uname:uname,
                pwd:pwd
            },
            dataType:"json",
            success:function (result) {

                $loginBox.find(".colWarning").html(result.msg);

                console.log(result.code);
                if(result.code==2){
                    //登陆成功
                    // $loginBox.hide();
                    // $userInfo.show();
                    // //判断是管理员还是普通用户
                    // if(result.info.isAdmin==0){        //普通用户
                    //     $userInfo.find("p.userName span").html(result.info.uname);
                    //     $userInfo.find("p.adminInfo").hide();
                    // }else if(result.info.isAdmin==1){   //管理员
                    //     $userInfo.find("p.userName span").html(result.info.uname);
                    //     $userInfo.find("p.adminInfo").show();
                    // }
                    window.location.reload();
                }
            }
        });
    });

    //退出登陆
    $("#logout").on("click",function () {
        $.ajax({
            url:'/api/user/logout',
            success:function (result) {
               if(!result.code){
                    window.location.reload();
               }
            }
        });
    });
});


