import { WebSpritePetElement } from './DesktopPetElement';

const elementName = 'web-sprite-pet';
const legacyElementName = 'desktop-pet';

if (!customElements.get(elementName)) {
  customElements.define(elementName, WebSpritePetElement);
}

if (!customElements.get(legacyElementName)) {
  customElements.define(legacyElementName, WebSpritePetElement);
}

export { WebSpritePetElement, WebSpritePetElement as DesktopPetElement };
