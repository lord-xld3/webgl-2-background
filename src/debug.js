/** Insert an input control into the page
 * @param {HTMLElement} parent parent element to insert control into
 * @param {String} controlName name of control
 * @param {String} controlType type of control (range, number, etc)
 * @param {Object} attributes attributes to set on control
 * @param {Function} callback callback function to call when control changes
 * @returns {HTMLElement} control container element
 */
export function setControl(parent, controlName, controlType, attributes, callback) {
    const container = document.createElement('div');

    const label = document.createElement('label');
    label.textContent = controlName;
    label.setAttribute('for', controlName);

    const control = document.createElement('input');
    control.type = controlType;
    control.id = controlName;
    control.name = controlName;

    parent.appendChild(container);
    container.appendChild(label);
    container.appendChild(control);

    switch (controlType) {
        case 'range':
            control.min = attributes.min;
            control.max = attributes.max;
            control.step = attributes.step;
            control.value = attributes.init;

            const display = document.createElement('span');
            display.textContent = control.value;

            control.addEventListener('input', function () {
                let value = parseFloat(control.value);
                callback(value);
                display.textContent = value;
            });

            container.appendChild(display);
            break;

        case 'checkbox':
            control.checked = attributes.init;

            control.addEventListener('change', function () {
                callback(control.checked);
            });
            break;

        default:
            throw new Error(`Unrecognized control type ${controlType}`);
    }

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