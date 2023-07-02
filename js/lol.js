const api = 'https://api-bqmvjmtk6q-uc.a.run.app/matches/get/single/';

async function getMatch(player1, player2, nbGames) {
    // replace spaces with %20
    player1 = player1.replace(/ /g, '%20');
    player2 = player2.replace(/ /g, '%20');

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
        throw new Error('No match found');
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

async function handleButtonClick() {
    const player1Input = document.getElementById('player1');
    const player2Input = document.getElementById('player2');
    const nbGamesInput = document.getElementById('nbGames');
    const loadingButton = document.getElementById('btnGetMatch');

    const player1 = player1Input.value;
    const player2 = player2Input.value;
    const nbGames = parseInt(nbGamesInput.value);

    loadingButton.disabled = true;
    loadingButton.textContent = 'Loading...';

    try {
        const matchData = await getMatch(player1, player2, nbGames);
        console.log(matchData);
        var numGames = matchData.length;
        var dates = matchData.map(function (match) {
            return formatDate(new Date(match.player1.gameStartTime));
        });

        // Display the number of games
        var numGamesElement = document.getElementById('numGames');
        numGamesElement.innerHTML = 'Number of games played together: ' + numGames;

        // Display the dates
        var datesElement = document.getElementById('dates');
        datesElement.innerHTML = 'Dates: <br>' + dates.join('<br>');
        updateDivVisibility();
    } catch (error) {
        if (error.message !== 'No match found') {
            alert('An error occurred');
            console.log(error);
        }
        // Display the number of games
        var numGamesElement = document.getElementById('numGames');
        numGamesElement.innerHTML = 'Number of games played together: ' + 0;

        // Display the dates
        var datesElement = document.getElementById('dates');
        datesElement.innerHTML = '';
        updateDivVisibility();
    } finally {
        loadingButton.disabled = false;
        loadingButton.textContent = 'Get Match';
    }
}

document.getElementById('btnGetMatch').addEventListener('click', handleButtonClick);
