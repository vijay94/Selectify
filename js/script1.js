/*
Copyright 2018 Vijay s
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE
*/
(function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

  // The base Class implementation (does nothing)
  this.Class = function(){};

  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
    var _super = this.prototype;

    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;

    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" &&
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;

            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];

            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);
            this._super = tmp;

            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }

    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }

    // Populate our constructed prototype object
    Class.prototype = prototype;

    // Enforce the constructor to be what we expect
    Class.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;

    return Class;
  };
})();

var Selectify = Class.extend({
  element : $("#selectify"),
  selectifiedElement : null,
  isSelectedAll : false,
  option:{
    autoSelect : true
  },
  init: function(element,option){
    this.element = element;
    this.consrtruct();
  },

  consrtruct : function () {
    this.create();
  },

  create : function () {
    this.createElement();
    this.initListeners();
  },

  createElement : function () {
    var attr = this.element.getProps();
    this.element.prop('class','');
    this.element.prop('id','');
    this.element.prop('style','');
    var template = $("<div/>",attr);
    template.prepend($("<ul/>",{ class : 'selected-values-list' }))
    template.append($("<input/>",{ class : 'selectify-input-box' }));

    var wrapper = $("<div/>",{ class : "drop-down-select-wrapper" });

    var list = $("<ul/>",{ class : "drop-down-select-list" });
    var liElement = $("<li/>",{ value : 'Select All'});
    liElement.attr('data-value','Select All');
    liElement.attr('data-text','Select All');
    liElement.html('Select All');
    liElement.prepend("<input type='checkbox'/>")
    list.append(liElement);
    this.element.children('option').each(function (index,option){
      var optionAttributes = $(option).getProps();
      liElement = $("<li/>",optionAttributes);
      liElement.attr('data-value',$(option).prop('value'));
      liElement.attr('data-text',$(option).html());
      liElement.html($(option).html());
      liElement.prepend("<input type='checkbox'/>")
      list.append(liElement);
    });
    this.element.prepend("<option value='Select All'>Select All</option>");
    this.element.val('');
    wrapper.append(list);

    template.append(wrapper);
    this.element.hide();
    this.selectifiedElement = this.element;
    this.element.after(template);
    this.element = template;
  },

  initListeners : function(){
    var self = this;

    this.element.find(".drop-down-select-list").on('click','li',function(event){
      self.doProcess(this);
    });

    this.element.find(".selected-values-list").on('click','li',function(event){
      var removedText = $(this).data('text');
      var removedValue = $(this).data('value');
      if (removedText == 'Select All') {
        self.element.find(".drop-down-select-list li>input").toggleState();
        self.selectifiedElement.find('option').prop('selected', "");
      } else {
        self.selectifiedElement.find('option[value="'+removedValue+'"]').prop('selected', "");
        self.element.find(".drop-down-select-list li[data-text='"+removedText+"']").toggleState();
      }
      this.remove();
    });

    this.element.find('.selectify-input-box').on('keyup',function(event){
      var enteredText = $(this).val();
      if(event.which == 13 && enteredText!=''){

        self.element.find(".selected-values-list li").remove();
        self.element.find(".drop-down-select-list li>input").unselectState();
        self.selectifiedElement.find('option').prop('selected', "");

        //add everything to selected list
        self.element.find(".drop-down-select-list li").each(function (index, availableList){
          if((''+$(availableList).data('text')).startsWith(enteredText)){
            if('Select All'.startsWith(enteredText)){
              self.isSelectedAll = true;
              var list  = self.element.find('.drop-down-select-list li[data-text="Select All"]');
              var elementTOBeAdded = $(list).clone();
              elementTOBeAdded.find('input[type=checkbox]').remove();
              self.element.find('.selected-values-list').append(elementTOBeAdded);
              self.selectifiedElement.find('option').prop('selected', true);
              self.element.find(".drop-down-select-list li>input").selectState();
            } else {
              $(availableList).children('input[type=checkbox]').toggleState();
              var selectedValue = $(availableList).prop("value");
              if( !$(availableList).children('input[type=checkbox]').prop("checked") ){
                self.selectifiedElement.find('option[value="'+selectedValue+'"]').prop('selected', "");
                self.element.find(".selected-values-list li[value='"+selectedValue+"']").remove();
              }else{
                var elementTOBeAdded = $(availableList).clone();
                elementTOBeAdded.find('input').remove();
                $(self.selectifiedElement).find('option[value="'+selectedValue+'"]').prop('selected', "");
                self.element.find('.selected-values-list').append(elementTOBeAdded);
              }
            }
          }
        });
      } else {
        self.element.find(".drop-down-select-list li").each(function (index, availableList){
          if(!(''+$(availableList).data('text')).startsWith(enteredText)){
            $(availableList).hide();
          }else{
            $(availableList).show();
          }
        });
      }
    });
  },

  doProcess : function (element){
    var self = this;
    $(element).children('input[type=checkbox]').toggleState();
    var selectedValue = $(element).data("value");
    var selectedText = $(element).data("text");
    if ( selectedValue == "Select All" ) {
      if( !$(element).children('input[type=checkbox]').prop("checked") ){
        self.isSelectedAll = false;
        self.selectifiedElement.find('option').prop("selected","");
        self.element.find(".selected-values-list li").remove();
        self.element.find(".drop-down-select-list li>input").unselectState();
      }else{
        self.element.find('.selected-values-list li').remove();
        self.isSelectedAll = true;
        var elementTOBeAdded = $(element).clone();
        elementTOBeAdded.find('input[type=checkbox]').remove();
        self.element.find('.selected-values-list').append(elementTOBeAdded);
        self.element.find(".drop-down-select-list li>input").selectState();
        self.selectifiedElement.find('option').prop("selected",true);
        self.selectifiedElement.find('option[value="Select All"]').prop("selected","");
      }
    } else {
      if( !$(element).children('input[type=checkbox]').prop("checked") ){
        if ( self.isSelectedAll ) {
          self.isSelectedAll = false;
          self.element.find('.selected-values-list li').remove();
          self.selectifiedElement.find('option').prop("selected","");
          self.element.find('.drop-down-select-list li[data-text="Select All"]>input').unselectState();
          self.element.find(".drop-down-select-list li").each(function (index, list){
            if($(list).data('text') != selectedText && $(list).data('text')!='Select All'){
              var elementTOBeAdded = $(list).clone();
              elementTOBeAdded.find('input[type=checkbox]').remove();
              self.selectifiedElement.find('option[value="'+$(list).data('value')+'"]').prop("selected",true);
              self.element.find('.selected-values-list').append(elementTOBeAdded);
            }
          });
        } else {
          self.selectifiedElement.find('option[value="'+selectedValue+'"]').prop('selected',"");
          self.element.find(".selected-values-list li[data-text='"+selectedText+"']").remove();
        }
      }else{

          var elementTOBeAdded = $(element).clone();
          elementTOBeAdded.find('input[type=checkbox]').remove();
          self.selectifiedElement.find('option[value="'+selectedValue+'"]').prop("selected",true);
          self.element.find('.selected-values-list').append(elementTOBeAdded);

      }
    }
  },

  sortList : function (element) {
    element.html(element.find('li').sort(function(x, y) {
    // to change to descending order switch "<" for ">"
      return $(x).text() > $(y).text() ? 1 : -1;
  }));
  }
});

$.fn.getProps = function() {
  if(arguments.length === 0) {
    if(this.length === 0) {
      return null;
    }

    var obj = {};
    $.each(this[0].attributes, function() {
      if(this.specified) {
        obj[this.name] = this.value;
      }
    });
    return obj;
  }

  return old.apply(this, arguments);
};

$.fn.Selectify = function(option){
    new Selectify(this,option);
};

$.fn.add = function (element){
  var optionAttributes = $(element).getProps();
  var name = this.attr('name');
  var value = $(element).prop('value');
  var html = $(element).html();
  liElement = $("<li/>",optionAttributes);
  liElement.attr('data-value',value);
  liElement.attr('data-text',html);
  liElement.html(html);
  liElement.prepend("<input type='checkbox'/>")
  this.siblings('select[name="'+name+'"]').append(element);
  this.find('.drop-down-select-list').append(liElement);
};

$.fn.select = function (valueArrays){
  for( var i=0; i<valueArrays.length; i++){
    var name = this.attr('name');
    $(this).siblings('select[name="'+name+'"] option[value="'+valueArrays[i]+'"]').prop('selected',true);
    var element = this.find('.drop-down-select-list li[data-text="'+valueArrays[i]+'"]');
    if (element) {
      var elementTOBeAdded = $(element).clone();
      elementTOBeAdded.find('input[type=checkbox]').remove();
      this.find('.selected-values-list').append(elementTOBeAdded);
      this.find('.drop-down-select-list li[data-text="'+valueArrays[i]+'"]>input').selectState();
    }
  }
}

$.fn.selectifiedValue = function(option){
    var selectedValues = [];
    $(this).find('.selected-values-list li').each(function(index, list){
      selectedValues.push($(list).data('value'));
    })
    return selectedValues.join(',');
};

$.fn.toggleState = function (){
  this.prop("checked", !this.prop("checked"));
}

$.fn.selectState = function (){
  this.prop("checked", 'true');
}

$.fn.unselectState = function (){
  this.prop("checked", false);
}
