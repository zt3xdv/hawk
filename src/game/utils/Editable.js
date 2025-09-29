import Options from './Options.js';

class Editable {
  static clickDelay = 300;
  static states = new WeakMap();
  static current = null;
  static tooltip = null;

  static setEditable(elementRaw, scene) {
    const element = elementRaw.image;
    Editable.states.set(element, {
      editMode: false,
      mode: 'move',
      lastClickTime: 0,
      raw: elementRaw,
      dragOffset: { x: 0, y: 0 }
    });
    element.setInteractive({ draggable: true });

    if (!Editable.tooltip) {
      Editable._createTooltip(scene);
    }

    element.on('pointerdown', pointer => {
      const state = Editable.states.get(element);
      const now = scene.time.now;
      const delta = now - state.lastClickTime;

      
      
      const originX = (typeof element.originX === 'number') ? element.originX : 0.5;
      const originY = (typeof element.originY === 'number') ? element.originY : 0.5;
      const elemTopLeftX = element.x - element.displayWidth * originX;
      const elemTopLeftY = element.y - element.displayHeight * originY;

      state.dragOffset.x = pointer.worldX - elemTopLeftX;
      state.dragOffset.y = pointer.worldY - elemTopLeftY;

      if (Options.get("editorOneTimeClick") || delta < Editable.clickDelay) {
        if (Editable.current && Editable.current !== element) {
          Editable._disableEdit(Editable.current, scene);
        }
        if (!state.editMode) {
          Editable._enableEdit(element, scene, elementRaw);
        } else {
          Editable._disableEdit(element, scene, elementRaw);
        }
      }
      state.lastClickTime = now;
    });

    element.on('drag', pointer => {
      const state = Editable.states.get(element);
      if (!state.editMode || state.mode !== 'move') return;

      
      const targetTopLeftX = pointer.worldX - state.dragOffset.x;
      const targetTopLeftY = pointer.worldY - state.dragOffset.y;

      const originX = (typeof element.originX === 'number') ? element.originX : 0.5;
      const originY = (typeof element.originY === 'number') ? element.originY : 0.5;

      const newX = targetTopLeftX + element.displayWidth * originX;
      const newY = targetTopLeftY + element.displayHeight * originY;

      elementRaw.setPosition(newX, newY);
      Editable._updateTooltipPosition(element);
    });
  }

  static _createTooltip(scene) {
    const container = scene.add.container(0, 0);
    const bg = scene.add.rectangle(0, 0, 102, 20, 0x000000, 0.7).setOrigin(0);
    const btnMove = scene.add.text(5, 5, 'Move', { fontSize: '12px', color: '#fff' }).setInteractive();
    const btnDelete = scene.add.text(55, 5, 'Delete', { fontSize: '12px', color: '#f55' }).setInteractive();

    btnMove.on('pointerdown', () => {
      if (!Editable.current) return;
      const st = Editable.states.get(Editable.current);
      st.mode = 'move';
      btnMove.setStyle({ backgroundColor: '#555' });
      btnDelete.setStyle({ backgroundColor: null });
    });

    btnDelete.on('pointerdown', () => {
      if (!Editable.current) return;
      const element = Editable.current;
      const state   = Editable.states.get(element);
      const raw     = state.raw;

      Editable.tooltip.setVisible(false);
      Editable.states.delete(element);
      
      scene.networkManager.emitDeleteElement(raw);
      scene.mapObjects.destroy(raw);

      Editable.current = null;
      scene.inputManager.joystickSetEnabled(true);
    });

    container.add([bg, btnMove, btnDelete]);
    container.setDepth(100000000).setVisible(false);
    Editable.tooltip = container;
  }

  static _enableEdit(element, scene, raw) {
    const state = Editable.states.get(element);
    state.editMode = true;
    state.mode = 'move';
    element.setAlpha(0.5);
    Editable.current = element;
    scene.inputManager.joystickSetEnabled(false);
    Editable.tooltip.setVisible(true);
    Editable.tooltip.list[1].setStyle({ backgroundColor: '#555' });
    Editable.tooltip.list[2].setStyle({ backgroundColor: null });
    Editable._updateTooltipPosition(element);
  }

  static _disableEdit(element, scene, raw) {
    const state = Editable.states.get(element);
    if (state.mode === 'delete') {
      element.emit('editableDelete', element);
    }
    state.editMode = false;
    element.setAlpha(1);
    Editable.current = null;
    scene.inputManager.joystickSetEnabled(true);
    Editable.tooltip.setVisible(false);
    
    scene.networkManager.emitMoveElement(raw);
  }

  static _updateTooltipPosition(element) {
    const offsetX = 0;
    const offsetY = 0;
    Editable.tooltip.x = element.x + offsetX;
    Editable.tooltip.y = element.y + offsetY - Editable.tooltip.list[0].height;
  }
}

export default Editable;
