/** Insert an input control into the page
 * @param {HTMLElement} parent parent element to insert control into
 * @param {String} controlName name of control
 * @param {String} controlType type of control (range, number, etc)
 * @param {Object} options options for control
 * @param {Number} options.min minimum value
 * @param {Number} options.max maximum value
 * @param {Number} options.step step value
 * @param {Number} options.init initial value
 * @param {Function} callback callback function to call when control changes
 * @returns {HTMLElement} control container element
 */
export function setControl(parent, controlName, controlType, options, callback) {
    const container = document.createElement('div');

    const label = document.createElement('label');
    label.textContent = controlName;
    label.setAttribute('for', controlName)

    const control = document.createElement('input');
    control.type = controlType;
    control.id = controlName;
    control.name = controlName;
    control.min = options.min;
    control.max = options.max;
    control.step = options.step;
    control.value = options.init;

    const display = document.createElement('span');
    display.textContent = control.value;
    
    control.addEventListener('input', function() {
        let value = parseFloat(control.value);
        callback(value)
        display.textContent = value;
    });

    parent.appendChild(container);
    container.appendChild(label);
    container.appendChild(control);
    container.appendChild(display);

    return container;
}

/** Use a button to toggle display of an element
 * @param {HTMLElement} element element to toggle display of
 * @param {HTMLElement} button button to toggle display with
 * @param {String} display display style to use when element is visible
 */
export function toggleDisplay(element, button, display) {
    button.addEventListener('click', function() {
        if (element.style.display === 'none') {
            element.style.display = display;
        } else {
            element.style.display = 'none';
        }
    })
}