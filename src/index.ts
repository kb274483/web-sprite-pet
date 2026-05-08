import { WebSpritePetElement } from './DesktopPetElement';

const elementName = 'web-sprite-pet';

if (!customElements.get(elementName)) {
  customElements.define(elementName, WebSpritePetElement);
}

export { WebSpritePetElement };
