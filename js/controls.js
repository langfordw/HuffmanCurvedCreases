/**
 * Created by ghassaei on 10/31/16.
 */


function initControls(globals){

    window.addEventListener('resize', function(){
        globals.threeView.onWindowResize();
    }, false);

    $("#logo").mouseenter(function(){
        $("#activeLogo").show();
        $("#inactiveLogo").hide();
    });
    $("#logo").mouseleave(function(){
        $("#inactiveLogo").show();
        $("#activeLogo").hide();
    });

    setLink("#about", function(){
        $('#aboutModal').modal('show');
    });

    setLink("#export", function(){
        console.log('coming soon');
    });

    setLink("#addConic", function(){
        globals.addConic(new Conic("hyperbola", new THREE.Vector3(100,50,0), new THREE.Vector3(0,-1,0), 60, 60, [-120,120], 0));
    });

    setLink("#removeConic", function(){
        globals.removeConic(globals.selectedObject.conic);
    });

    function viewModeCallback(){
        globals.threeView.render();
    }

    function viewModeChange(val){
        viewModeCallback();
    }

    function updateControls() {
        if (globals.selectedObject != {} && globals.selectedObject.hasOwnProperty('conic')) {
            var conic = globals.selectedObject.conic;

            setRadio("conicType",conic.type);
            setInput("#focusX",conic.focus.x);
            setInput("#focusY",conic.focus.y);
            setInput("#aDim",conic.a);
            setInput("#bDim",conic.b);
            setInput("#orientation",Math.atan2(conic.orientationVec.y,conic.orientationVec.x));
            setInput("#extentsMin",conic.extents[0]);
            setInput("#extentsMax",conic.extents[1]);
            setRadio("polarity",conic.polarity);
        }
    }

    

    setRadio("viewMode", globals.viewMode, viewModeChange);
    viewModeChange(globals.viewMode);

    setLink("#download", function(){
        var blob = new Blob([globals.getInfo()], {type: "text/plain;charset=utf-8"});
        saveAs(blob, "truss.txt");
    });


    setRadio("conicType", undefined, function(val) {
        // globals.selectedObject.conic.type = val;
        var old = globals.selectedObject.conic;
        var newConic = new Conic(val,old.focus,old.orientationVec,old.a,old.b,old.extents,old.polarity)
        globals.addConic(newConic);
        old.destroy();
        globals.selectedObject.conic = newConic;
    });

    setInput("#focusX", undefined, function(val) {
        var oldPosition = globals.selectedObject.conic.focusNode.getPosition();
        globals.selectedObject.conic.focusNode.move(new THREE.Vector3(val,oldPosition.y,oldPosition.z));
        globals.selectedObject.conic.moveCurve();
    });

    setInput("#focusY", undefined, function(val) {
        var oldPosition = globals.selectedObject.conic.focusNode.getPosition();
        globals.selectedObject.conic.focusNode.move(new THREE.Vector3(oldPosition.x,val,oldPosition.z));
        globals.selectedObject.conic.moveCurve();
    });

    setInput("#aDim", undefined, function(val) {
        var old = globals.selectedObject.conic;
        var newConic = new Conic(old.type,old.focus,old.orientationVec,val,old.b,old.extents,old.polarity)
        globals.addConic(newConic);
        old.destroy();
        globals.selectedObject.conic = newConic;
    });

    setInput("#bDim", undefined, function(val) {
        var old = globals.selectedObject.conic;
        var newConic = new Conic(old.type,old.focus,old.orientationVec,old.a,val,old.extents,old.polarity)
        globals.addConic(newConic);
        old.destroy();
        globals.selectedObject.conic = newConic;
    });

    setInput("#orientation", undefined, function(val) {
        var old = globals.selectedObject.conic;
        var newOrientation = new THREE.Vector3(Math.cos(val),Math.sin(val),0);
        var newConic = new Conic(old.type,old.focus,newOrientation,old.a,old.b,old.extents,old.polarity)
        globals.addConic(newConic);
        old.destroy();
        globals.selectedObject.conic = newConic;
    });

    setInput("#extentsMin", undefined, function(val) {
        var old = globals.selectedObject.conic;
        var newConic = new Conic(old.type,old.focus,old.orientationVec,old.a,old.b,[val, old.extents[1]],old.polarity)
        globals.addConic(newConic);
        old.destroy();
        globals.selectedObject.conic = newConic;
    });

    setInput("#extentsMax", undefined, function(val) {
        var old = globals.selectedObject.conic;
        var newConic = new Conic(old.type,old.focus,old.orientationVec,old.a,old.b,[old.extents[0], val],old.polarity)
        globals.addConic(newConic);
        old.destroy();
        globals.selectedObject.conic = newConic;
    });

    setInput("#polarity", undefined, function(val) {
        var old = globals.selectedObject.conic;
        var newConic = new Conic(old.type,old.focus,old.orientationVec,old.a,old.b,old.extents,val)
        globals.addConic(newConic);
        old.destroy();
        globals.selectedObject.conic = newConic;
    });

    // setInput("#aDim",conic.a);
    // setInput("#bDim",conic.b);
    // setInput("#orientation",Math.atan2(conic.orientationVec.y,conic.orientationVec.x));
    // setInput("#extentsMin",conic.extents[0]);
    // setInput("#extentsMax",conic.extents[1]);
    // setRadio("polarity",conic.polarity);

    function setLink(id, callback){
        $(id).click(function(e){
            e.preventDefault();
            if (callback != undefined) { callback(e); }
        });
    }

    function setRadio(name, val, callback){
        $("input[name=" + name + "]").on('change', function() {
            var state = $("input[name="+name+"]:checked").val();
            if (callback != undefined) { callback(state); }
        });
        $(".radio>input[value="+val+"]").prop("checked", true);
    }

    function setInput(id, val, callback, min, max){
        var $input = $(id);
        $input.change(function(){
            var val = $input.val();
            if ($input.hasClass("int")){
                if (isNaN(parseInt(val))) return;
                val = parseInt(val);
            } else {
                if (isNaN(parseFloat(val))) return;
                val = parseFloat(val);
            }
            if (min !== undefined && val < min) val = min;
            if (max !== undefined && val > max) val = max;
            $input.val(val);
            if (callback != undefined) { callback(val); }
        });
        if (val != undefined) { $input.val(val); }
    }

    // function setInputCallback(id, callback, min, max){
    //     var $input = $(id);
    //     $input.change(function(){
    //         var val = $input.val();
    //         if ($input.hasClass("int")){
    //             if (isNaN(parseInt(val))) return;
    //             val = parseInt(val);
    //         } else {
    //             if (isNaN(parseFloat(val))) return;
    //             val = parseFloat(val);
    //         }
    //         if (min !== undefined && val < min) val = min;
    //         if (max !== undefined && val > max) val = max;
    //         $input.val(val);
    //         if (callback != undefined) { callback(val); }
    //     });
    //     $input.val(val);
    // }

    function setCheckbox(id, state, callback){
        var $input  = $(id);
        $input.on('change', function () {
            if ($input.is(":checked")) callback(true);
            else {
                if (callback != undefined) { callback(false); }
            }
        });
        $input.prop('checked', state);
    }

    function setSlider(id, val, min, max, incr, callback, callbackOnStop){
        var slider = $(id).slider({
            orientation: 'horizontal',
            range: false,
            value: val,
            min: min,
            max: max,
            step: incr
        });
        slider.on("slide", function(e, ui){
            var val = ui.value;
            callback(val);
        });
        slider.on("slidestop", function(){
            var val = slider.slider('value');
            if (callbackOnStop) callbackOnStop(val);
        })
    }

    function setSliderInput(id, val, min, max, incr, callback){

        var slider = $(id+">div").slider({
            orientation: 'horizontal',
            range: false,
            value: val,
            min: min,
            max: max,
            step: incr
        });

        var $input = $(id+">input");
        $input.change(function(){
            var val = $input.val();
            if ($input.hasClass("int")){
                if (isNaN(parseInt(val))) return;
                val = parseInt(val);
            } else {
                if (isNaN(parseFloat(val))) return;
                val = parseFloat(val);
            }

            var min = slider.slider("option", "min");
            if (val < min) val = min;
            if (val > max) val = max;
            $input.val(val);
            slider.slider('value', val);
            callback(val);
        });
        $input.val(val);
        slider.on("slide", function(e, ui){
            var val = ui.value;
            $input.val(val);
            callback(val);
        });
    }


    return {
        viewModeCallback: viewModeCallback,
        setRadio: setRadio,
        setInput: setInput,
        updateControls: updateControls
    }
}