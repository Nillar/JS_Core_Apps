$(() => {
    renderCatTemplate();

    function renderCatTemplate() {
        let cats = window.cats;
        let container = $('#allCats');
        let templateHTML = $('#cat-template').html();
        let template = Handlebars.compile(templateHTML);

        container.html(template({cats:cats}));

        $('.btn.btn-primary').on('click', displayDetails);

        function displayDetails() {
            let button = $(this);
            let details = $(this).next();
            if(button.text() === 'Show status code'){
                $(details).css('display', 'block');
                button.text('Hide status code');
            }else  {
                $(details).css('display', 'none');
                button.text('Show status code');
            }
        }
    }
});