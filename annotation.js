class Observable {
    constructor(value) {
        this.value = value;
        this.observers = [];
        this.observe = this.observe.bind(this);
        this.postValue = this.postValue.bind(this);
        this.remove = this.remove.bind(this);
        this.getValue = this.getValue.bind(this);
    }
    observe(cb) {
        this.observers.push(cb);
    }

    remove(cb) {
        this.observers = this.observers.filter(v => v !== cb);
    }

    postValue(value) {
        if (this.value === value) return;
        this.value = value;
        this.observers.forEach(cb => cb(value));
    }

    getValue() {
        return this.value;
    }
}


const isStart = new Observable(false);


function onClickAction() {
    if (isStart.getValue()) {
        isStart.postValue(false);
    } else {
        isStart.postValue(true);
    }
}

function main() {

    const containerClass = "__web_annotation_container";
    const actionClass = "__web_annotation_action";
    const targetClass = "__web_annotation_target";
    const selectedClass = "__web_annotation_selected";

    let currentSelected = null;

    const linkTag = document.createElement('link');
    linkTag.rel = "stylesheet";
    linkTag.href = "./annotation.css";
    document.head.appendChild(linkTag);

    const divTag = document.createElement("div");
    const buttonTag = document.createElement("button");
    divTag.classList.add(containerClass);
    buttonTag.classList.add(actionClass);

    divTag.append("Web annotation");
    buttonTag.append("Start");
    buttonTag.addEventListener('click', function(e) {
        e.preventDefault();
        onClickAction();
    });

    

    function onElementClick(e) {
        onClearSelected();
        if ([document.body, divTag, buttonTag].includes(e.target)) return;
        e.target.classList.add(selectedClass);
        currentSelected = e.target;
    }

    function onClearSelected() {
        if (!currentSelected || [document.body, divTag, buttonTag].includes(currentSelected)) return;
        currentSelected.classList.remove(selectedClass);
        currentSelected = null;
    }

    function onMouseOver(e) {
        if ([document.body, divTag, buttonTag].includes(e.target)) return;
        e.target.classList.add(targetClass);
        e.target.addEventListener('click', onElementClick);
    }

    function onMouseOut(e) {
        if ([document.body, divTag, buttonTag].includes(e.target)) return;
        e.target.classList.remove(targetClass);
        e.target.removeEventListener('click', onElementClick);
    }

    isStart.observe(v => {
        if (v) {
            buttonTag.innerText = "Stop";
            document.body.addEventListener('mouseover', onMouseOver)
            
            document.body.addEventListener('mouseout', onMouseOut)
        }
        else {
            buttonTag.innerText = "Start";
            document.body.removeEventListener('mouseover', onMouseOver)
            
            document.body.removeEventListener('mouseout', onMouseOut)
        }
    });

    divTag.appendChild(buttonTag);

    document.body.appendChild(divTag);
}

window.onload = function() {
    main()
}

