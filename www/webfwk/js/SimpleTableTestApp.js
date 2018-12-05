define([
    'webfwk/Class',
    'webfwk/CSSLoader',
    'webfwk/FwkApplication',
    'webfwk/SimpleTable',
    'underscore'],

function(Class,
         CSSLoader,
         FwkApplication,
         SimpleTable) {

    CSSLoader.load('webfwk/css/SimpleTableTestApp.css');

    function SimpleTableTestApp(name) {

        var _that = this;

        // Allways call the base class's constructor
        FwkApplication.call(this, name);

        /**
         * Override event handler defined in the base class
         *
         * @see FwkApplication.fwk_app_on_show
         */
        this.fwk_app_on_show = function() {
            console.log('show: ' + this.fwk_app_name);
            this._init();
        };

        this.fwk_app_on_hide = function() {
            console.log('hide: ' + this.fwk_app_name);
        };

        this.fwk_app_on_update = function() {
            if (this.fwk_app_visible) {
                this._init();
            }
        };

        this._initialized = false;
        this._init = function() {
            if (this._initialized) return;
            this._initialized = true;

            var html = `
<div id="table1"></div>
<div id="table2"></div>
<div id="table3"></div>
<div>
  <button type="button" class="btn btn-success btn-sm" id="table4-load">Load</button>
  <button type="button" class="btn btn-danger  btn-sm" id="table4-erase">Erase</button>
</div>
<div id="table4"></div>
<button type="button" class="btn btn-success btn-sm" id="table5-load">Load</button>
<div id="table5">Loading...</div>
<div id="table6"></div>
<div id="table7"></div>`;
            this.fwk_app_container.html(html);

            this._init_table1();
            this._init_table2();
            this._init_table3();
            this._init_table4();
            this._init_table5();
            this._init_table6();
            this._init_table7();
        };

        this._table1_obj = null;
        this._init_table1 = function() {
            if (!this._table1_obj) {
                this._table1_obj = new SimpleTable.constructor(
                    this.fwk_app_container.children('#table1'),

                    [{name: '1'},
                     {name: '2'},
                     {name: '3', sorted: false}],

                    [['1(1)','2(2)','3(2)'],
                     ['2(1)','3(2)','4(2)'],
                     ['3(1)','4(2)','1(2)'],
                     ['4(1)','1(2)','2(2)']]
                );
                this._table1_obj.display();
            }
        };
 
        this._table2_obj = null;
        this._init_table2 = function() {
            if (!this._table2_obj) {
                this._table2_obj = new SimpleTable.constructor(
                    this.fwk_app_container.children('#table2'),

                    [{name: 'id'},
                     {name: '2', coldef: [
                        {name: '2.1'},
                        {name: '2.2'}]},
                     {name: '3'},
                     {name: '4'}],

                    [['1', '1(2.1)', '1(2.2)', '1(3)', '1(4)'],
                     ['2', '2(2.1)', '2(2.2)', '2(3)', '2(4)'],
                     ['3', '3(2.1)', '3(2.2)', '3(3)', '3(4)'],
                     ['4', '4(2.1)', '4(2.2)', '4(3)', '4(4)']]
                );
                this._table2_obj.display();
            }
        };

        this._table3_obj = null;
        this._init_table3 = function() {
            if (!this._table3_obj) {
                this._table3_obj = new SimpleTable.constructor(
                    this.fwk_app_container.children('#table3'),

                    [{name: 'id'},
                     {name: '2', coldef: [
                        {name: '2.1', coldef: [
                            {name: '2.1.1'},
                            {name: '2.1.2'}]},
                        {name: '2.2'}]},
                      {name: '3'},
                      {name: '4'}],

                    [['1', '1(2.1.1)', '1(2.1.2)', '1(2.2)', '1(3)', '1(4)'],
                     ['2', '2(2.1.1)', '2(2.1.2)', '2(2.2)', '2(3)', '2(4)'],
                     ['3', '3(2.1.1)', '3(2.1.2)', '3(2.2)', '3(3)', '3(4)'],
                     ['4', '4(2.1.1)', '4(2.1.2)', '4(2.2)', '4(3)', '4(4)']]
                );
                this._table3_obj.display();
            }
        };

        this._table4_obj = null;
        this._init_table4 = function() {
            if (!this._table4_obj) {

                function MyCellType() {
                    SimpleTable.CellType.call(this);
                }
                Class.define_class(MyCellType, SimpleTable.CellType, {}, {
                   to_string:      function(a)   { return '<b>'+a+'</b>'; } ,
                   compare_values: function(a,b) { return this.compare_strings(a,b); }}
                ) ;
                this._table4_obj = new SimpleTable.constructor(
                    this.fwk_app_container.children('#table4'),

                    [{name: 'Text_URL',   type: SimpleTable.Types.Text_URL},
                     {name: 'Number_URL', type: SimpleTable.Types.Number_URL} ,
                     {name: 'MyCellType', type: new MyCellType},
                     {name: 'Customized', type: {to_string:      function(a)   { return SimpleTable.html.Button(a.data, {name: a.data, classes: 'btn-info btn-sm my_button'}); },
                                                 compare_values: function(a,b) { return a.data - b.data ; } ,
                                                 after_sort:     function()    { $('.my_button').button().click(function () { alert(this.name); }); }}}],

                    // No data rows yet
                    null,
                    SimpleTable.Status.Empty
                );
                this._table4_obj.display();

                var data4 = [
                    [{text: 'A',         url: 'https://www.slac.stanford.edu'}, {number: 123, url: 'https://www.slac.stanford.edu'}, '3(2)', {data:  3}],
                    [{text: 'a',         url: 'https://www.slac.stanford.edu'}, {number: -99, url: 'https://www.slac.stanford.edu'}, '4(2)', {data: 11}],
                    [{text: 'xYz',       url: 'https://www.slac.stanford.edu'}, {number:   3, url: 'https://www.slac.stanford.edu'}, '1(2)', {data: 12}],
                    [{text: 'let it be', url: 'https://www.slac.stanford.edu'}, {number:   0, url: 'https://www.slac.stanford.edu'}, '2(2)', {data:  1}]
                ] ;
                this.fwk_app_container.find('#table4-load').button().click(function() {
                    _that._table4_obj.load(data4);
                });
                this.fwk_app_container.find('#table4-erase').button().click(function() {
                    _that._table4_obj.erase();
                });
            }
        };

        this._table5_obj = null;
        this._init_table5 = function() {
            if (!this._table5_obj) {
                this._table5_obj = new SimpleTable.constructor(
                    this.fwk_app_container.children('#table5'),

                    [{name: 'Number', type: SimpleTable.Types.Number},
                     {name: 'Text'}]
                );
                this._table5_obj.display();

                this.fwk_app_container.find('#table5-load').button().click(function() {
                    _that._table5_obj.erase(SimpleTable.Status.Loading);
                    $.ajax({
                        type: 'GET',
                        url:  'webfwk/ws/table_data.json' ,
                        success: function(data) {
                            _that._table5_obj.load(JSON.parse(data));
                        },
                        error: function() {
                            _that._table5_obj.erase(SimpleTable.Status.error('service is not available'));
                        },
                        dataType: 'html'
                    });
                });
            }
        };

        this._table6_obj = null;
        this._init_table6 = function() {
            if (!this._table6_obj) {
                this._table6_obj = new SimpleTable.constructor(
                    this.fwk_app_container.children('#table6'),

                    [{name: '1'} ,
                     {name: '2'} ,
                     {name: 'hideable', hideable: true},
                     {name: '4',                                       align: 'center'},
                     {name: '5',        hideable: true, sorted: false, align: 'right'}],

                    [['1(1)','2(2)','3(3)',     4,    5],
                     ['2(1)','3(2)','4(3)', 12554,  333],
                     ['3(1)','4(2)','1(3)',     1,   23],
                     ['4(1)','1(2)','2(3)',    21,    0],
                     ['7(1)','8(2)','9(3)',    56, 1999]]
                );
                this._table6_obj.display();
            }
        };

        this._table7_obj = null;
        this._init_table7 = function() {
            if (!this._table7_obj) {
                this._table7_obj = new SimpleTable.constructor(
                    this.fwk_app_container.children('#table7'),

                    [{name: '1'},
                     {name: 'custom style', style:   'color: red; font-size: 125%'},
                     {name: 'last',         hideable: true, sorted: true, align: 'right'}],

                    [['1(1)',     4,    5],
                     ['2(1)', 12554,  333],
                     ['3(1)',     1,   23],
                     ['4(1)',    21,    0],
                     ['7(1)',    56, 1999]]
                );
                this._table7_obj.display();
            }
        };
    }
    Class.define_class(SimpleTableTestApp, FwkApplication, {}, {});

    return SimpleTableTestApp;
});

