
window.$templateEl= document.currentScript.ownerDocument.querySelector('template');

class MemoryBoard extends HTMLElement {

	constructor(props) {
		super(props);

		this._dimens= {};

		// The change in points for each event
		// incr or [ incr, time ]
		this.pointsIncr= {
			CORRECT: 10,
			WRONG: -2,
			TIME: [-1, 5000],
			HINT: [-20, 1500],
		};

		// Available images
		this._images= [
			'./components/img/img1.png',
			'./components/img/img2.png',
			'./components/img/img3.png',
			'./components/img/img4.png',
			'./components/img/img5.png',
			'./components/img/img6.png'
		];

		this._root= this.attachShadow({mode:'open'});
		this._root.appendChild(window.$templateEl.content.cloneNode(true));

		this._resizeHandler= this._resizeHandler.bind(this);
		this._hintBtnClickHandler= this._hintBtnClickHandler.bind(this);
	}


	connectedCallback() {

		this.rows= this.getAttribute('rows');
		this.cols= this.getAttribute('cols');

		this._$container= this._root.querySelector('.js-container');
		this._$scoreBoard= this._root.querySelector('.js-score-board');
		this._$scoreBtn= this._root.querySelector('.js-hint-btn');

		// Set up the game
		this.initGame();

		// Bind event handlers
		this._$scoreBtn.addEventListener('click', this._hintBtnClickHandler);
		window.addEventListener('resize', this._resizeHandler);
	}

	disconnectedCallback() {
		this._$scoreBtn.removeEventListener('click', this._hintBtnClickHandler);
		window.removeEventListener('resize', this._resizeHandler);
	}


	// Initial setup to begin the game
	initGame() {

		// Empty the container
		// TODO: Try a reset to default instead of a rerender
		this._$container.innerHTML= '';

		// Set matched cards to 0
		this._matchedCards= 0;
		
		// Set initial score
		this._setScore(0);

		// Start score deduction timer
		this._startScoreLoop();


		// Generate the grid and render elements
		this._generateGrid(this.rows, this.cols);
		this._randomizeList(this._grid);
		this._$container.appendChild(this._renderGrid());

		// Scale the grid
		this._resizeHandler();
	}


	// Start timer to deduct score
	_startScoreLoop() {
		
		this._timer= setInterval(()=> {

			this._addScore(this.pointsIncr.TIME[0]);

		}, this.pointsIncr.TIME[1]);
	}

	// Set the score to a particular value
	_setScore(score) {
		this._score= score;
		this._updateScore();
	}

	// Increment/Decrement the score by some value
	_addScore(incr) {
		this._setScore(this._score + incr);
	}

	// Render the score to the scoreboard
	_updateScore() {
		this._$scoreBoard.textContent= this._score+'';
	}

	_randomizeList(list, runTwice=true) {

		const getRandomNum= () => Math.floor(Math.random()*list.length);

		for(let i=0; i< list.length; i++) {

			for(let j=0; j< list[0].length; j++) {

				// Random row and col indexes
				const randI= getRandomNum();
				const randJ= getRandomNum();


				// Swap the current element with a random element
				const tmp= Object.create(list[i][j]);

				list[i][j]= list[randI][randJ];
				list[randI][randJ]= tmp;
			}
		}

		// Run it twice for more randomness
		if(runTwice)
			return this._randomizeList(list, false);
	}

	// window resize event handler
	_resizeHandler() {

		const bounds= this.getBoundingClientRect();

		this._dimens.width= bounds.width;
		this._dimens.height= bounds.width;

		this._root.querySelector('.wrapper').style.height= `${this._dimens.height}px`;

		for(let row of this._grid) {

			for(let col of row) {

				col.$elem.style.width= (this._dimens.width/this.rows - 10) + 'px';
				col.$elem.style.height= (this._dimens.height/this.cols - 10) + 'px';
			}
		}
	}

	// Generate the grid
	_generateGrid(rows, cols) {

		this._grid= [];

		for(let i= 0; i< rows; i++) {

			this._grid.push([]);

			for(let j= 0; j< cols; j++) {

				this._grid[i].push({
					id: i+'',
					image: this._images[i],
					active: false,
				});
			}
		}
	}

	// Create the elements to render in the container
	_renderGrid() {

		const $wrapper= document.createElement('div');
		$wrapper.classList.add('wrapper');

		// Iterate trough the grid and create elements to render
		this._grid.forEach( (row, i) => {

			const $row= document.createElement('div');
			$row.classList.add('board-row');

			row.forEach( (col, j) => {

				const $col= document.createElement('mem-card');

				// Set properties
				$col.setAttribute('cardid', col.id);
				$col.setAttribute('image', col.image);
				$col.setAttribute('row', i);
				$col.setAttribute('col', j);

				$col.parentClickHandlerHook= (rowID, colID)=> this._cardSelectHandler(rowID, colID);

				$row.appendChild($col);

				col['$elem']= $col;
			});

			$wrapper.appendChild($row);
		});

		return $wrapper;
	}


	// Hook executed when a card is selected
	_cardSelectHandler(row, col) {
		
		const card= this._grid[row][col];

		// If this is a fresh click,
		// set the card as current
		if(!this._currentCard)
			return this._currentCard= card;

		// If its two clicks on the same card,
		// dont do shit
		if(this._currentCard == card)
			return;

		// Delay before checking
		setTimeout( () => {

			// If they have the same id, match them
			// Else, wrong match
			if(this._currentCard.id === card.id) {

				// Mark both cards as matched
				this._currentCard.$elem.matchComplete();
				card.$elem.matchComplete();

				// Add points
				this._addScore(this.pointsIncr.CORRECT);

				// Two cards were matched i.e. one pair
				this._matchedCards+= 2;
				
				// Check if the game is complete
				this._checkIfComplete();
			} else {

				// Deduct points
				this._addScore(this.pointsIncr.WRONG);

				// Hide both cards
				this._currentCard.$elem.hide();
				card.$elem.hide();
			}
			
			// No current card
			this._currentCard= null;

		}, 500);
	}

	// Check if the game is complete
	_checkIfComplete() {

		if(this._matchedCards === this.rows*this.cols) {

			// Delay for the animations
			setTimeout(() => {

				alert(`You have scored ${this._score} points`);

				clearInterval(this._timer);

				this.initGame();
			}, 400);
		}
	}

	// Iterates through the grid and calls the callback at each element
	_gridIterator(fn) {

		this._grid.forEach( (row, i) => {

			row.forEach( (col, j) => fn(col, i, j));
		});
	}

	// Show all the cards
	showAll() {

		this._gridIterator( col => {
			col.$elem.show();
		});
	}

	// Hide all the cards
	hideAll() {

		this._gridIterator( col => {
			col.$elem.hide();
		});
	}

	// To get hint
	showAllForHint(time=1000) {

		// Decrement the score
		this._addScore(this.pointsIncr.HINT[0]);

		// Show all
		this.showAll();

		// Hide after some time
		setTimeout(() => {

			this.hideAll();

		}, time);
	}

	_hintBtnClickHandler() {
		this.showAllForHint(this.pointsIncr.HINT[1]);
	}
}

window.customElements.define(window.$templateEl.dataset.elem, MemoryBoard);
