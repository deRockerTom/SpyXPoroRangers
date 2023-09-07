const api = 'https://api-bqmvjmtk6q-uc.a.run.app/matches/get/single/';

async function getMatch(player1, player2, nbGames) {
    // replace spaces with %20
    player1 = player1.replace(/ /g, '%20');
    player2 = player2.replace(/ /g, '%20');
    if (nbGames < 0) {
        throw new Error('Number of games must be positive');
    }

    const requests = [];
    for (let i = 0; i < nbGames; i += 10) {
        const requestPromise = axios.get(api + player1 + '/' + player2 + '/' + i.toString() + '/euw1');
        requests.push({ index: i, promise: requestPromise });
    }

    const responses = await Promise.all(requests.map(request =>
        request.promise.catch((err) => {
            if (err.response && err.response.status === 404) {
                return { error: 'Not found' };
            } else {
                return { error: err.message };
            }
        })
    ));

    // Check if all responses have error status 'Not found'
    if (responses.every(response => response.error === 'Not found')) {
        throw new Error('Player not found');
    }

    const arr = [];
    for (const response of responses) {
        for (let j = 0; j < response.data.singleResults.length; j++) {
            arr.push(response.data.singleResults[j]);
        }
        console.log(response.data);
    }

    // Sort the data based on your desired criteria
    arr.sort((a, b) => {
        // Replace the logic below with your sorting criteria
        const dateA = new Date(a.player1.gameStartTime);
        const dateB = new Date(b.player1.gameStartTime);
        return dateB - dateA;
    });

    return arr;
}

function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' };
    return date.toLocaleDateString(undefined, options);
}

function updateDivVisibility() {
    const numGamesDiv = document.getElementById('numGames');
    const datesDiv = document.getElementById('dates');

    numGamesDiv.style.display = numGamesDiv.innerHTML !== '' ? 'flex' : 'none';
    datesDiv.style.display = datesDiv.innerHTML !== '' ? 'flex' : 'none';
}

function removeErrorMessage() {
    document.getElementById('error').innerHTML = '';
}

function roundToNextTenth(num) {
    return Math.ceil(num / 10) * 10;
}

function handleError(error) {
    switch (error.message) {
        case 'Please enter both players':
            document.getElementById('error').innerHTML = 'Please enter both players';
            break;
        case 'Please enter a positive number of games':
            document.getElementById('error').innerHTML = 'Please enter a positive number of games';
            break;
        case 'Player not found':
            document.getElementById('error').innerHTML = 'One of the players doesn\'t exist';
            break;
        default:
            document.getElementById('error').innerHTML = 'An error occurred, please try again';
            console.log(error);
            break;
    }
    document.getElementById('numGames').innerHTML = '';
}


async function handleButtonClick() {
    const player1Input = document.getElementById('player1');
    const player2Input = document.getElementById('player2');
    const nbGamesInput = document.getElementById('nbGames');
    const loadingButton = document.getElementById('btnGetMatch');

    const player1 = player1Input.value;
    const player2 = player2Input.value;
    try {
        if (player1 === '' || player2 === '') {
            throw new Error('Please enter both players');
        }
        const nb = parseInt(nbGamesInput.value);
        if (!nb || nb <= 0) {
            throw new Error('Please enter a positive number of games');
        }
        const nbGames = roundToNextTenth(nb)
        console.log(nbGames);

        loadingButton.disabled = true;
        loadingButton.textContent = 'Loading...';

        const matchData = await getMatch(player1, player2, nbGames);
        console.log(matchData);
        var numGames = matchData.length;
        var dates = matchData.map(function (match) {
            return formatDate(new Date(match.player1.gameStartTime));
        });

        // Display the number of games
        var numGamesElement = document.getElementById('numGames');
        if (numGames > 0) {
            numGamesElement.innerHTML = `Number of games played together in the last ${nbGames} games: ${numGames}`;

            // Display the dates
            var datesElement = document.getElementById('dates');
            datesElement.innerHTML = 'Dates: <br>' + dates.join('<br>');
        }
        else {
            numGamesElement.innerHTML = `No games played together in the last ${nbGames} games`;
        }
        removeErrorMessage();
        updateDivVisibility();
    } catch (error) {
        handleError(error);
    } finally {
        loadingButton.disabled = false;
        loadingButton.textContent = 'Get Match';
    }
}

document.getElementById('btnGetMatch').addEventListener('click', handleButtonClick);

document.getElementById('nbGames').addEventListener('keyup', function (event) {
    // Number 13 is the "Enter" key on the keyboard
    if (event.key === "Enter" || event.keyCode === 13) {
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button click
        document.getElementById('btnGetMatch').click();
    }
});