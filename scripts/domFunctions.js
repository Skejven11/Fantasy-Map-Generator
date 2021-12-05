function menuButtonToggle () {
    const menuButton = document.querySelector(".menu-button");
    const menu = document.querySelector(".user-menu");
    menu.classList.toggle("user-menu-active");
    menuButton.classList.toggle("menu-button-active");
}

function worldShapeToggle () {
    const worldShapeInput = document.getElementById("worldShape");
    const worldShapeSteps = document.getElementById("worldSteps");
    worldShapeSteps.innerHTML = worldShapeInput.value;
    worldShapeSteps.innerHTML = worldShapeInput.value;
}

function worldDetailToggle () {
    const worldDetailInput = document.getElementById("worldDetail");
    const worldDetailSteps = document.getElementById("detailSteps");
    worldDetailSteps.innerHTML = worldDetailInput.value;
    worldDetailSteps.innerHTML = worldDetailInput.value;
}

function modalButtonToggle () {
    const modalScreen = document.querySelector(".modal-screen");
    const modalContent = document.querySelector(".modal-content");
    modalScreen.style.visibility = "visible";
    modalContent.style.top = "10%";
    window.onclick = function(event) {
        if (event.target == modalScreen) {
        modalScreen.style.visibility = "hidden";
        modalContent.style.top = "-100%";
        }
    } 
}

function ribbonInputToggle () {
    const ribbonInput = document.getElementById("ribbon");
    const canvas = document.getElementById("myCanvas");
    var ctx = canvas.getContext('2d');
    draw(worldGlobal, ctx, canvas);
    
}