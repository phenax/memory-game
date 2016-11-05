
window.$templateEl= document.currentScript.ownerDocument.querySelector('template');

class MemoryCard extends HTMLElement {

	constructor(props) {
		super(props);

		this._root= this.attachShadow({mode:'open'});
		this._root.appendChild(window.$templateEl.content.cloneNode(true));

		this._clickHandler= this._clickHandler.bind(this);
	}

	connectedCallback() {

		this.$card= this._root.querySelector('.js-card');
		this._content= this.$card.querySelector('.js-card-back .js-content');

		this._id= this.getAttribute('cardid');
		this._image= this.getAttribute('image');
		this._content.style.backgroundImage= `url(${this._image})`;

		this._row= this.getAttribute('row');
		this._col= this.getAttribute('col');

		this.addEventListener('click', this._clickHandler);
	}

	disconnectedCallback() {
		this.removeEventListener('click', this._clickHandler);
	}

	// Card click handler
	_clickHandler() {
		
		// If the mem-board attached a hook, execute it
		if(this.parentClickHandlerHook)
			this.parentClickHandlerHook(this._row, this._col);

		// if the card face is not showing, show it,
		// else, hide it
		if(!this.$card.style.transform || this.$card.style.transform == '')
			this.show();
		else
			this.hide();
	}

	// If the card is matched, give it a matched class(opacity=0)
	matchComplete() {
		this.$card.classList.add('matched');
	}

	// Show the card face
	show() {

		window.requestAnimationFrame( () => {
			this.$card.style.transform= 'translateZ(-200px) rotateY(-180deg)';
		});
	}

	// Hide the card face
	hide() {

		window.requestAnimationFrame( () => {
			this.$card.style.transform= null;
		});
	}
}


window.customElements.define(window.$templateEl.dataset.elem, MemoryCard);
