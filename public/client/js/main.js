(function ($) {
    "use strict";

    // Spinner
    var spinner = function () {
        setTimeout(function () {
            if ($('#spinner').length > 0) {
                $('#spinner').removeClass('show');
            }
        }, 1);
    };
    spinner(0);


    // Fixed Navbar
    $(window).scroll(function () {
        if ($(window).width() < 992) {
            if ($(this).scrollTop() > 55) {
                $('.fixed-top').addClass('shadow');
            } else {
                $('.fixed-top').removeClass('shadow');
            }
        } else {
            if ($(this).scrollTop() > 55) {
                $('.fixed-top').addClass('shadow').css('top', 0);
            } else {
                $('.fixed-top').removeClass('shadow').css('top', 0);
            }
        }
    });


    // Back to top button
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({ scrollTop: 0 }, 1500, 'easeInOutExpo');
        return false;
    });


    // Testimonial carousel
    $(".testimonial-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 2000,
        center: false,
        dots: true,
        loop: true,
        margin: 25,
        nav: true,
        navText: [
            '<i class="bi bi-arrow-left"></i>',
            '<i class="bi bi-arrow-right"></i>'
        ],
        responsiveClass: true,
        responsive: {
            0: {
                items: 1
            },
            576: {
                items: 1
            },
            768: {
                items: 1
            },
            992: {
                items: 2
            },
            1200: {
                items: 2
            }
        }
    });


    // vegetable carousel
    $(".vegetable-carousel").owlCarousel({
        autoplay: true,
        smartSpeed: 1500,
        center: false,
        dots: true,
        loop: true,
        margin: 25,
        nav: true,
        navText: [
            '<i class="bi bi-arrow-left"></i>',
            '<i class="bi bi-arrow-right"></i>'
        ],
        responsiveClass: true,
        responsive: {
            0: {
                items: 1
            },
            576: {
                items: 1
            },
            768: {
                items: 2
            },
            992: {
                items: 3
            },
            1200: {
                items: 4
            }
        }
    });


    // Modal Video
    $(document).ready(function () {
        var $videoSrc;
        $('.btn-play').click(function () {
            $videoSrc = $(this).data("src");
        });
        console.log($videoSrc);

        $('#videoModal').on('shown.bs.modal', function (e) {
            $("#video").attr('src', $videoSrc + "?autoplay=1&amp;modestbranding=1&amp;showinfo=0");
        })

        $('#videoModal').on('hide.bs.modal', function (e) {
            $("#video").attr('src', $videoSrc);
        })
    });



    // Product Quantity
    // $('.quantity button').on('click', function () {
    //     var button = $(this);
    //     var oldValue = button.parent().parent().find('input').val();
    //     if (button.hasClass('btn-plus')) {
    //         var newVal = parseFloat(oldValue) + 1;
    //     } else {
    //         if (oldValue > 0) {
    //             var newVal = parseFloat(oldValue) - 1;
    //         } else {
    //             newVal = 0;
    //         }
    //     }
    //     button.parent().parent().find('input').val(newVal);
    // });
    $('.quantity button').on('click', function () {
        let change = 0;

        var button = $(this);
        var oldValue = button.parent().parent().find('input').val();
        if (button.hasClass('btn-plus')) {
            var newVal = parseFloat(oldValue) + 1;
            change = 1;
        } else {
            if (oldValue > 1) {
                var newVal = parseFloat(oldValue) - 1;
                change = -1;
            } else {
                newVal = 1;
            }
        }
        const input = button.parent().parent().find('input');
        input.val(newVal);

        //set from index
        const index = input.attr("data-cart-detail-index")
        const el = document.getElementById(`cartDetails[${index}]`);
        $(el).val(newVal);

        //set quantity for detail page
        const elDetail = document.getElementById("quantityDetail");
        if (elDetail) {
            $(elDetail).val(newVal);
        }

        //get price
        const price = input.attr("data-cart-detail-price");
        const id = input.attr("data-cart-detail-id");

        const priceElement = $(`p[data-cart-detail-id='${id}']`);
        if (priceElement) {
            const newPrice = +price * newVal;
            priceElement.text(formatCurrency(newPrice));
        }

        //update total cart price
        const totalPriceElement = $(`p[data-cart-total-price]`);

        if (totalPriceElement && totalPriceElement.length) {
            const currentTotal = totalPriceElement.first().attr("data-cart-total-price");
            let newTotal = +currentTotal;
            if (change === 0) {
                newTotal = +currentTotal;
            } else {
                newTotal = change * (+price) + (+currentTotal);
            }

            //update
            totalPriceElement?.each(function (index, element) {
                //update text
                $(totalPriceElement[index]).text(formatCurrency(newTotal));

                //update data-attribute
                $(totalPriceElement[index]).attr("data-cart-total-price", newTotal);
            });
        }

        // Update cart badge in header
        const cartBadge = document.getElementById('sumCartBadge');
        if (cartBadge && change !== 0) {
            const currentBadge = parseInt(cartBadge.textContent.trim()) || 0;
            cartBadge.textContent = currentBadge + change;
        }
    });

    function formatCurrency(value) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency', currency: 'VND'
        }).format(value)
    }

    //add active cho client
    const navElement = $("#navbarCollapse");
    const currentUrl = window.location.pathname;
    navElement.find('a.nav-link').each(function () {
        const link = $(this); // Get the current link in the loop
        const href = link.attr('href'); // Get the href attribute of the link

        if (href === currentUrl) {
            link.addClass('active'); // Add 'active' class if the href matches the current URL
        } else {
            link.removeClass('active'); // Remove 'active' class if the href does not match
        }
    });

    // handle filter products
    $('#btnFilter').on('click', function (event) {
        event.preventDefault();

        let factoryArr=[];
        let targetArr=[];
        let priceArr=[];

        //factory filter
        $('#factoryFilter .form-check-input:checked').each(function () {
            factoryArr.push($(this).val());
        });

        //target filter
        $('#targetFilter .form-check-input:checked').each(function () {
            targetArr.push($(this).val());
        });

        //price filter
        $('#priceFilter input[type="checkbox"]:checked').each(function () {
            priceArr.push($(this).val());
        });

        // sort order
        let sortValue = $('input[name="radio-sort"]:checked').val(); 

        const currentUrl = new URL(window.location.href);

        // Clear existing filter parameters
        currentUrl.searchParams.delete('factory');
        currentUrl.searchParams.delete('target');
        currentUrl.searchParams.delete('price');
        currentUrl.searchParams.delete('sort');
        currentUrl.searchParams.set('page', 1); // Reset to first page on new filter

        // Add new filter parameters
        if (factoryArr.length > 0) {
            currentUrl.searchParams.set('factory', factoryArr.join(','));
        }
        if (targetArr.length > 0) {
            currentUrl.searchParams.set('target', targetArr.join(','));
        }
        if (priceArr.length > 0) {
            currentUrl.searchParams.set('price', priceArr.join(','));
        }
        if (sortValue && sortValue !== 'gia-khong-sap-xep') {
            currentUrl.searchParams.set('sort', sortValue);
        }   

        // Redirect to the updated URL
        window.location.href = currentUrl.toString();
    });

    const params = new URLSearchParams(window.location.search);

    // set checked for factory filter
    if (params.has('factory')) {
        const factories = params.get('factory').split(',');
        factories.forEach(factory => {
            $(`#factoryFilter .form-check-input[value="${factory}"]`).prop('checked', true);
        });
    }

    // set checked for target filter
    if (params.has('target')) {
        const targets = params.get('target').split(',');
        targets.forEach(target => {
            $(`#targetFilter .form-check-input[value="${target}"]`).prop('checked', true);
        });
    }

    // set checked for price filter
    if (params.has('price')) {
        const prices = params.get('price').split(',');
        prices.forEach(price => {
            $(`#priceFilter .form-check-input[value="${price}"]`).prop('checked', true);
        });
    }

    // set checked for sort order
    if (params.has('sort')) {
        const sort = params.get('sort');
        $(`input[name="radio-sort"][value="${sort}"]`).prop('checked', true);
    }

    // handle add to cart with ajax
    $('.btnAddToCartHomepage').on('click', function (event) {
        event.preventDefault();

        if(!isLogin()){
            $.toast({
                heading: 'Warning',
                text: 'Please log in to add products to your cart.',
                showHideTransition: 'fade',
                icon: 'warning',
                position: 'top-right'
            });
            return;
        }
        const productId = $(this).attr('data-product-id');
        $.ajax({
            url: `${window.location.origin}/api/add-product-to-cart`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ productId: productId, quantity: 1 }),
            success: function(response) {
                const sum = response.data;
                $('#sumCart').text(sum);
                $.toast({
                    heading: 'Success',
                    text: response.message,
                    showHideTransition: 'fade',
                    icon: 'success',
                    position: 'top-right'
                });
                // Update cart count or other UI elements if needed
            },
            error: function(xhr, status, error) {
                $.toast({
                    heading: 'Error',
                    text: 'Failed to add product to cart.',
                    showHideTransition: 'fade',
                    icon: 'error',
                    position: 'top-right'
                });
            }
        });
    });

    $('.btnAddToCartDetail').on('click', function (event) {
        event.preventDefault();

        if(!isLogin()){
            $.toast({
                heading: 'Warning',
                text: 'Please log in to add products to your cart.',
                showHideTransition: 'fade',
                icon: 'warning',
                position: 'top-right'
            });
            return;
        }

        const productId = $(this).attr('data-product-id');
        const quantity = parseInt($('#quantityDetail').val()) || 1;

        $.ajax({
            url: `${window.location.origin}/api/add-product-to-cart`,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ productId: productId, quantity: quantity }),
            success: function(response) {
                const sum = response.data;
                $('#sumCart').text(sum);
                $.toast({
                    heading: 'Success',
                    text: response.message,
                    showHideTransition: 'fade',
                    icon: 'success',
                    position: 'top-right'
                });
                // Update cart count or other UI elements if needed
            },
            error: function(xhr, status, error) {
                $.toast({
                    heading: 'Error',
                    text: 'Failed to add product to cart.',
                    showHideTransition: 'fade',
                    icon: 'error',
                    position: 'top-right'
                });
            }
        });
    });
    function isLogin(){
        const navElement = $("#navbarCollapse");
        const childLogin = navElement.find('a.a-login');
        if(childLogin && childLogin.length > 0){
            return false;
        }
        return true;
    }   

})(jQuery);

