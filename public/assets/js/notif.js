var alertExpand = false;
            $('.alert-unread').click(function(){
                $(this).removeClass('alert-unread').addClass('alert-read');
            });
            $('.alert').click(function(){
                if(alertExpand){
                    $(this).find(".noty-body").remove();
                    alertExpand = false;
                } else {
                    alertExpand = true;
                    $(this).append($('<div class="noty-body">Sorry,this section is still under development...</div>'));
                }
            });

