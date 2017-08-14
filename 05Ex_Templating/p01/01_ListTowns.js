function attachEvents() {
    $('#btnLoadTowns').on('click', getTowns);

    async function getTowns() {
        // gets input splited as an array
        let towns = await $('#towns').val().split(", ");

        // gets the template
        let list = await $('#towns-template').html();

        //compiles the template
        let template =await Handlebars.compile(list);

        //gets the container
        let container = await $('#root');


        // populates the template
        // transform the array from [] to {towns:[]}
        container.html(template({towns:towns}));
    }
}