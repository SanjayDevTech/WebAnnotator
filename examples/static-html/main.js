const content = document.getElementById('content');
const incButton = document.getElementById('inc-button');

let counter = 0;
content.innerHTML = counter;

incButton.addEventListener('click', () => {
    counter++;
    content.innerHTML = counter;
});
