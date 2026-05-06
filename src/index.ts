import { DesktopPetElement } from './DesktopPetElement';

const elementName = 'desktop-pet';

if (!customElements.get(elementName)) {
  customElements.define(elementName, DesktopPetElement);
}

export { DesktopPetElement };
