$(document).ready(function () {
    const API_BASE_URL = 'http://localhost:4000/api/v1';

    const getToken = () => {
        const userId = sessionStorage.getItem('userId');

        if (!userId) {
            Swal.fire({
                icon: 'warning',
                text: 'You must be logged in to access this page.',
                showConfirmButton: true
            }).then(() => {
                window.location.href = 'login.html';
            });
            return;
        }
        return true
    }

    $("#register").on('click', function (e) {
        e.preventDefault();
        let name = $("#name").val()
        let email = $("#email").val()
        let password = $("#password").val()
        let user = {
            name,
            email,
            password
        }
        $.ajax({
            method: "POST",
            url: `${url}api/v1/register`,
            data: JSON.stringify(user),
            processData: false,
            contentType: 'application/json; charset=utf-8',
            dataType: "json",
            success: function (data) {
                console.log(data);
                Swal.fire({
                    icon: "success",
                    text: "register success",
                    position: 'bottom-right'

                });
            },
            error: function (error) {
                console.log(error);
            }
        });
    });

    $('#loginForm').submit(function(e) {
  e.preventDefault();
  
  $.ajax({
    url: `${API_BASE_URL}/login`,
    method: 'POST',
    contentType: 'application/json',
   data: JSON.stringify({
    email: $('#email').val(),
    password: $('#password').val()
  }),
    success: function(response) {
  if (response && response.token) {
    localStorage.setItem('token', response.token);
    
    // Decode the JWT token to get the role
    const tokenParts = response.token.split('.');
    if (tokenParts.length === 3) {
      const payload = JSON.parse(atob(tokenParts[1]));
      
      if (payload.role === 'admin') {
        window.location.href = '/public/dashboard.html';
      } else {
        window.location.href = '/public/home.html';
      }
    } else {
      Swal.fire('Error', 'Invalid token format', 'error');
    }
  } else {
    Swal.fire('Error', 'Invalid response from server', 'error');
  }
},
    error: function(xhr) {
      let errorMsg = 'Login failed';
      
      // Try to get error message from response
      if (xhr.responseJSON && xhr.responseJSON.message) {
        errorMsg = xhr.responseJSON.message;
      } else if (xhr.status === 404) {
        errorMsg = 'API endpoint not found. Please check the server.';
      } else if (xhr.responseText) {
        try {
          const err = JSON.parse(xhr.responseText);
          errorMsg = err.message || errorMsg;
        } catch (e) {
          errorMsg = xhr.responseText || errorMsg;
        }
      }
      
      Swal.fire('Error', errorMsg, 'error');
    }
  });
});

    $('#avatar').on('change', function () {
        const file = this.files[0];
        console.log(file)
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                console.log(e.target.result)
                $('#avatarPreview').attr('src', e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });

    $("#updateBtn").on('click', function (event) {
        event.preventDefault();
        userId = sessionStorage.getItem('userId') ?? sessionStorage.getItem('userId')

        var data = $('#profileForm')[0];
        console.log(data);
        let formData = new FormData(data);
        formData.append('userId', userId)

        $.ajax({
            method: "POST",
            url: `${url}api/v1/update-profile`,
            data: formData,
            contentType: false,
            processData: false,
            dataType: "json",
            success: function (data) {
                console.log(data);
                Swal.fire({
                    text: data.message,
                    showConfirmButton: false,
                    position: 'bottom-right',
                    timer: 1000,
                    timerProgressBar: true

                });
            },
            error: function (error) {
                console.log(error);
            }
        });
    });

    $('#loginBody').load("header.html");


    $("#profile").load("header.html", function () {
        // After header is loaded, check sessionStorage for userId
        if (sessionStorage.getItem('userId')) {
            // Change Login link to Logout
            const $loginLink = $('a.nav-link[href="login.html"]');
            $loginLink.text('Logout').attr({ 'href': '#', 'id': 'logout-link' }).on('click', function (e) {
                e.preventDefault();
                sessionStorage.clear();
                window.location.href = 'login.html';
            });
        }
    });

    $("#deactivateBtn").on('click', function (e) {
        e.preventDefault();
        let email = $("#email").val()
        let user = {
            email,
        }
        $.ajax({
            method: "DELETE",
            url: `${url}api/v1/deactivate`,
            data: JSON.stringify(user),
            processData: false,
            contentType: 'application/json; charset=utf-8',
            dataType: "json",
            success: function (data) {
                console.log(data);
                Swal.fire({
                    text: data.message,
                    showConfirmButton: false,
                    position: 'bottom-right',
                    timer: 2000,
                    timerProgressBar: true
                });
                sessionStorage.removeItem('userId')
                // window.location.href = 'home.html'
            },
            error: function (error) {
                console.log(error);
            }
        });
    });

})