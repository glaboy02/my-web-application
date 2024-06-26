document.addEventListener("DOMContentLoaded", () => {
    const db = new PouchDB('anime_bookmarks');
    function navigate(viewId) {
      // Hide all views
        document.querySelectorAll(".view").forEach((view) => {
        view.style.display = "none";
        });

        // Show the requested view
        document.getElementById(viewId).style.display = "block";

        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (viewId !== 'animeDetailView2') {
            clearAnimeDetailView(); // Clear the video when leaving animeDetailView
        }
    }

    document
        .getElementById("home")
        .addEventListener("click", () => navigate("homeView"));
    document
        .getElementById("bookmark")
        .addEventListener("click", () => navigate("bookmarkView"));

    document
        .getElementById("account")
        .addEventListener("click", () => {
            const info = document.querySelector('.info');

            if(getComputedStyle(info).textDecorationLine !== 'line-through'){
                navigate("accountView")
            }
        });

    // document
    //     .getElementById("plus")
    //     .addEventListener("click", () => {
    //         const info = document.querySelector('.info');
    //         return info.removeAttribute('style');
    //     });

    // document
    //     .getElementById("minus")
    //     .addEventListener("click", () => {
    //         const info = document.querySelector('.info');
    //         return info.setAttribute(
    //             'style',
    //             'text-decoration: line-through'
    //         );
    //     });

        
    document
        .getElementById("signInGo")
        .addEventListener("click", () => {
            console.log('Go Button clicked')
            navigate("accountView")
        });

    document
        .getElementById("signUpGo")
        .addEventListener("click", () => navigate("accountView"));

    // document.getElementById("bookmarkCardIcon").addEventListener("click", (event) => {
    //     event.preventDefault(); // Prevent default anchor tag behavior
    //     console.log(event.target.parentNode.parentNode.parentNode.firstElementChild.innerHTML)
    //     navigate("accountView");
    // });

    // Initialize with the home view
    navigate("homeView");

    // Assuming your images are within a container with the class
    'image-container'
    document.querySelectorAll(".image-container img").forEach((img) => {
        img.addEventListener("click", function () {
        const parent = this.parentNode;
        parent.insertBefore(this, parent.firstChild); // Move the clicked image to the beginning
        });
    });

    async function fetchAnimeData(searchQuery) {
        try {
            const response = await fetch('http://localhost:3260/api/anilist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    query: `
                        query ($id: Int, $page: Int, $perPage: Int, $search: String) {
                        Page (page: $page, perPage: $perPage) {
                            pageInfo {
                            total
                            currentPage
                            lastPage
                            hasNextPage
                            perPage
                            }
                            media (id: $id, search: $search type: ANIME) {
                            id
                            title {
                                romaji
                            }
                            coverImage{
                                large
                            }
                            }
                        }
                        }
                        `,
                    variables: { 
                        search: searchQuery ,
                        page: 1,
                        perPage: 25
                    },
                }),
            });
            const data = await response.json();
            console.log(data.data.Page.media)
            return data.data.Page.media;
        } catch (error) {
            console.error('Error fetching data:', error);
            return null;
        }
    }
    // Function to display search results in the results view
    function displaySearchResults(animeList) {
        const searchResultsContainer = document.getElementById("searchResultsContainer");
        searchResultsContainer.innerHTML = ''; // Clear previous content

        animeList.forEach(anime => {
            const animeCard = document.createElement("div");
            animeCard.className = "col col-12 col-md-6 col-lg-2 mb-4"; // Adjust the classes as needed
            animeCard.innerHTML = `
                <div class="card">
                    <a href="" id="imageButton">
                        <img src="${anime.coverImage.large}" class="card-img-top" alt="${anime.title.romaji}">
                    </a>
                    <div class="bg-dark">
                        <div class="animeFooter">
                            <h3 class="animeName">${anime.title.romaji}</h3>
                            <div class="bookmark-icon">
                                <a href="" id="bookmarkCardIcon" data-anime-id="${anime.id}">
                                    <i class="bi bi-file-plus"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            searchResultsContainer.appendChild(animeCard);

            const bookmarkButton = animeCard.querySelector('#bookmarkCardIcon');
            bookmarkButton.addEventListener('click', (event) => {
                event.preventDefault();
                toggleBookmark(anime.id);
                bookmarkedID();
            });

            const imageButton = animeCard.querySelector('#imageButton');
            imageButton.addEventListener('click', (event) => {
                event.preventDefault();
                fetchAnimeDetail(anime.id);
                navigate('animeDetailView');
            });
        });

        // Navigate to the search results view
        navigate('searchResultsView');
    }

    // Event listener for the search button
    const searchButton = document.getElementById('searchButton');
    searchButton.addEventListener('click', async function() {
        const searchInput = document.getElementById('searchBar').value.trim();
        if (searchInput === '') {
            console.error('Search input cannot be empty.');
            return;
        }

        try {
            const results = await fetchAnimeData(searchInput);
            if (results) {
                displaySearchResults(results);
            } else {
                console.error('No results found.');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    });


    function fetchTopAiringAnime() {
        const query = `
            query {
                Page(page: 1, perPage: 25) {
                    media(type: ANIME, format: TV, status: RELEASING, sort: POPULARITY_DESC) {
                        id
                        title {
                            romaji
                            english
                            native
                        }
                        coverImage {
                            large
                        }
                        description
                    }
                }
            }
        `;

        fetch('http://localhost:3260/api/anilist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ query })
        })
        .then(response => response.json())
        .then(data => {
            const animeList = data.data.Page.media;
            displayTopAiringAnime(animeList);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
    }
    
    fetchTopAiringAnime();

    function fetchUpcomingAnime() {
        const query = `
            query {
                Page(perPage: 25) {
                    media(status: NOT_YET_RELEASED, sort: POPULARITY_DESC) {
                        id
                        title {
                            romaji
                        }
                        coverImage {
                            large
                        }
                    }
                }
            }
        `;

        fetch('http://localhost:3260/api/anilist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ query })
        })
        .then(response => response.json())
        .then(data => {
            const animeList = data.data.Page.media;
            displayUpcomingAnime(animeList);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
    }

    
    fetchUpcomingAnime();

    function displayTopAiringAnime(animeList) {
        const animeSection = document.getElementById("cardSectionTwo");
        animeSection.innerHTML = ''; // Clear previous content
        animeList.slice(0, 6).forEach(anime => {
            const animeCard = document.createElement("div");
            animeCard.className = "col col-12 col-md-6 col-lg-2 mb-4"; // Adjust the classes as needed
            animeCard.innerHTML = `
                <div class="card">
                    <a href="" id="imageButton">
                        <img src="${anime.coverImage.large}" class="card-img-top" alt="${anime.title.romaji}">
                    </a>
                    <div class="bg-dark">
                        <div class="animeFooter">
                            <h3 class="animeName">${anime.title.romaji}</h3>
                            <div class="bookmark-icon">
                                <a href="" id="bookmarkCardIcon" data-anime-id="${anime.id}">
                                    <i class="bi bi-file-plus"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            animeSection.appendChild(animeCard);

            const bookmarkButton = animeCard.querySelector('#bookmarkCardIcon');
            bookmarkButton.addEventListener('click', (event) => {
                event.preventDefault();
                toggleBookmark(anime.id);
                bookmarkedID();
            });

            const imageButton = animeCard.querySelector('#imageButton');
            imageButton.addEventListener('click', (event) => {
                event.preventDefault();
                console.log("animeButton clicked")

                fetchAnimeDetail(anime.id);
                navigate('animeDetailView');
            })

        });
    }

    function displayUpcomingAnime(animeList) {
        const animeSection = document.getElementById("cardSectionThree");
        animeSection.innerHTML = ''; // Clear previous content

        animeList.splice(0, 6).forEach(anime => {
            const animeCard = document.createElement("div");
            animeCard.className = "col col-12 col-md-6 col-lg-2 mb-4"; // Adjust the classes as needed
            animeCard.innerHTML = `
                <div class="card">
                    <a href="" id="imageButton">
                        <img src="${anime.coverImage.large}" class="card-img-top" alt="${anime.title.romaji}">
                    </a>
                    <div class="bg-dark">
                        <div class="animeFooter">
                            <h3 class="animeName">${anime.title.romaji}</h3>
                            <div class="bookmark-icon">
                                <a href="" id="bookmarkCardIcon" data-anime-id="${anime.id}">
                                    <i class="bi bi-file-plus"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            animeSection.appendChild(animeCard);

            const bookmarkButton = animeCard.querySelector('#bookmarkCardIcon');
            bookmarkButton.addEventListener('click', (event) => {
                event.preventDefault();
                toggleBookmark(anime.id);
                bookmarkedID();
            });

            const imageButton = animeCard.querySelector('#imageButton');
            imageButton.addEventListener('click', (event) => {
                event.preventDefault();
                console.log("animeButton clicked")

                fetchAnimeDetail(anime.id);
                navigate('animeDetailView');
            })
        });
    }


    function fetchTopPopularAllTimeAnime() {
        const query = `
            query {
                Page(perPage: 25) {
                    media(sort:  POPULARITY_DESC) {
                        id
                        title {
                            romaji
                        }
                        coverImage {
                            large
                        }
                    }
                }
            }
        `;

        fetch('http://localhost:3260/api/anilist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ query })
        })
        .then(response => response.json())
        .then(data => {
            const animeList = data.data.Page.media;
            displayTopPopularAllTimeAnime(animeList);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
    }
    fetchTopPopularAllTimeAnime();

    function displayTopPopularAllTimeAnime(animeList) {
        const animeSection = document.getElementById("cardSectionFour");
        animeSection.innerHTML = ''; // Clear previous content

        animeList.slice(0, 6).forEach(anime => {
            const animeCard = document.createElement("div");
            animeCard.className = "col col-12 col-md-6 col-lg-2 mb-4"; // Adjust the classes as needed
            animeCard.innerHTML = `
                <div class="card">
                    <a href="" id="imageButton">
                        <img src="${anime.coverImage.large}" class="card-img-top" alt="${anime.title.romaji}">
                    </a>
                    <div class="bg-dark">
                        <div class="animeFooter">
                            <h3 class="animeName">${anime.title.romaji}</h3>
                            <div class="bookmark-icon">
                                <a href="" id="bookmarkCardIcon" data-anime-id="${anime.id}">
                                    <i class="bi bi-file-plus"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            animeSection.appendChild(animeCard);

            const bookmarkButton = animeCard.querySelector('#bookmarkCardIcon');
            bookmarkButton.addEventListener('click', (event) => {
                event.preventDefault();
                toggleBookmark(anime.id);
                bookmarkedID();
            });

            const imageButton = animeCard.querySelector('#imageButton');
            imageButton.addEventListener('click', (event) => {
                event.preventDefault();
                console.log("animeButton clicked");

                fetchAnimeDetail(anime.id);
                navigate('animeDetailView');
            });
        });
    }

    async function toggleBookmark(animeId) {
        try {
            const doc = await db.get(animeId.toString());
            await db.remove(doc);
            bookmarkedAnimeList = bookmarkedAnimeList.filter(anime => anime.id !== parseInt(animeId));
        } catch (err) {
            if (err.status === 404) {
                await db.put({
                    _id: animeId.toString(),
                    status: 'bookmarked'
                });
                const anime = await fetchBookmarkedAnimeData(animeId);
                if (anime) {
                    bookmarkedAnimeList.push(anime);
                }
            } else {
                console.error('Error toggling bookmark:', err);
            }
        } finally {
            displayBookmarkedAnime(bookmarkedAnimeList);
            displayBookmarkedAnimeInBookmark(bookmarkedAnimeList);
            await updateBookmarkUI();
        }
    }

    function updateAnimeStatus(animeId, status) {
        db.get(animeId.toString()).then(function(doc) {
            doc.status = status;
            return db.put(doc);
        }).catch(function(err) {
            if (err.status === 404) {
                db.put({
                    _id: animeId.toString(),
                    status: status
                });
            } else {
                console.error('Error updating status:', err);
            }
        }).finally(() => {
            updateStatusUI(animeId, status);
        });
    }

    let bookmarkedAnimeList = [];
    
    // Function to update UI based on bookmark status (simple example)
    async function updateBookmarkUI() {
        try {
            const result = await db.allDocs({ include_docs: true });
            const bookmarks = result.rows.map(row => row.doc);
            const bookmarkedAnimeIds = bookmarks.map(bookmark => bookmark._id);
            
            const bookmarkButtons = document.querySelectorAll('#bookmarkCardIcon');
            bookmarkButtons.forEach(button => {
                const animeId = button.getAttribute('data-anime-id');
                if (bookmarkedAnimeIds.includes(animeId)) {
                    button.innerHTML = '<i class="bi bi-file-plus-fill"></i>';
                } else {
                    button.innerHTML = '<i class="bi bi-file-plus"></i>';
                }
            });
    
            const bookmarkedAnimeList = await Promise.all(bookmarkedAnimeIds.map(id => fetchBookmarkedAnimeData(id)));
            displayBookmarkedAnime(bookmarkedAnimeList.filter(anime => anime));
            displayBookmarkedAnimeInBookmark(bookmarkedAnimeList.filter(anime => anime));
        } catch (err) {
            console.error('Error updating bookmark UI:', err);
        }
    }

    function bookmarkedID(){
        db.allDocs({ include_docs: true }).then(function(result) {
            const bookmarks = result.rows.map(row => row.doc._id);
            if (bookmarks.length === 0 && JSON.stringify(bookmarks) === '[]') {
                displayBookmarkedAnime(true);
                displayBookmarkedAnimeInBookmark(true);
                bookmarkedAnimeList = [];
            } else {
                bookmarkedAnimeList = [];
                let promises = bookmarks.map(id => fetchBookmarkedAnimeData(id));
                Promise.all(promises).then(results => {
                    results.forEach(anime => {
                        if (anime) {
                            bookmarkedAnimeList.push(anime);
                        }
                    });
                    displayBookmarkedAnime(bookmarkedAnimeList);
                    displayBookmarkedAnimeInBookmark(bookmarkedAnimeList);
                }).catch(error => {
                    console.error('Error fetching bookmarked anime:', error);
                });
            }
        }).catch(function(err) {
            console.error('Error fetching bookmarks:', err);
        });
    }

    bookmarkedID();

    async function fetchBookmarkedAnimeData(IdQuery) {
        const query = `
            query ($id: Int) {
                Media(id: $id, type: ANIME) {
                    id
                    title {
                        romaji
                    }
                    description
                    coverImage {
                        large
                    }
                }
            }
        `;
        const variables = { id: IdQuery };

        return fetch('http://localhost:3260/api/anilist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ query, variables })
        })
        .then(response => response.json())
        .then(data => {
            if (data.data && data.data.Media) {
                return data.data.Media;
            } else {
                console.error('Invalid API response:', data);
                throw new Error("Invalid API response");
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            return null;
        });
    }

    function displayBookmarkedAnime(animeList) {
        
        const bookmarkSection = document.getElementById('sectionOneOuterShell');
        
        if (animeList === true || animeList.length === 0) {
            // Handle case where no bookmarks are available
            bookmarkSection.innerHTML = '';
            const div = document.createElement("div");
            div.className = "noBookmarks";
            div.innerHTML = `
                <h5>No Bookmarks Available</h5>
            `;
            bookmarkSection.appendChild(div);
            return;
        }

        bookmarkSection.innerHTML = '';
        const div = document.createElement("div");
        div.className = "row row-cols-1 row-cols-md-5 g-4";
        div.setAttribute("id", "cardSectionOne")
        bookmarkSection.append(div)
            
        
        const animeSection = document.getElementById("cardSectionOne")
        animeSection.innerHTML = "";
        // console.log(bookmarkedAnimeList)
        const arrUniq = [...new Map(animeList.map(v => [v.id, v])).values()]
        // console.log(arrUniq)

        arrUniq.slice(0, 6).forEach(anime => {
            const animeCard = document.createElement("div");
            animeCard.className = "col col-12 col-md-6 col-lg-2 mb-4"; // Adjust the classes as needed
            animeCard.innerHTML = `
                <div class="card">
                    <a href="" id='imageButton'>
                        <img src="${anime.coverImage.large}" class="card-img-top" alt="${anime.title.romaji}">
                    </a>
                    <div class="bg-dark">
                        <div class="animeFooter">
                            <h3 class="animeName">${anime.title.romaji}</h3>
                            <div class="bookmark-icon">
                                <a href="" id="bookmarkCardIcon" data-anime-id="${anime.id}">
                                    <i class="bi bi-file-plus-fill"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            animeSection.appendChild(animeCard);

            const bookmarkButton = animeCard.querySelector('#bookmarkCardIcon');
            bookmarkButton.addEventListener('click', async (event) => {
                event.preventDefault();
                await toggleBookmark(anime.id);
            });

            const imageButton = animeCard.querySelector('#imageButton');
            imageButton.addEventListener('click', (event) => {
                event.preventDefault();
                // console.log("animeButton clicked")

                fetchAnimeDetail(anime.id);
                navigate('animeDetailView');
            })
        });
        
    }


    function displayBookmarkedAnimeInBookmark(animeList) {
        const animeSection = document.getElementById("bookmarkSection");
        if(animeList === true || animeList.length === 0){
            animeSection.innerHTML = '';
            const div = document.createElement("div");
            div.className = "noBookmarks";
            div.innerHTML = `
                <h5>No Bookmarks Available</h5>
                `;
            animeSection.appendChild(div);
            return;
        }

        animeSection.innerHTML = '';
        const div = document.createElement("div");
        div.className = "row row-cols-1 row-cols-md-5 g-4";
        div.setAttribute("id", "animeBookmarkSection")
        animeSection.append(div)

        const animeBookmark = document.getElementById("animeBookmarkSection");

        const arrUniq = [...new Map(animeList.map(v => [v.id, v])).values()]

        arrUniq.forEach(anime => {
            const animeCard = document.createElement("div");
            animeCard.className = "col col-12 col-md-6 col-lg-2 mb-4"; // Adjust the classes as needed
            animeCard.innerHTML = `
                <div class="card">
                    <a href="" id="imageButton">
                        <img src="${anime.coverImage.large}" class="card-img-top" alt="${anime.title.romaji}">
                    </a>
                    <select class="bg-dark anime-status-select" data-anime-id="${anime.id}">
                        <option value="none">None</option>
                        <option value="watching">Watching</option>
                        <option value="watched">Watched</option>
                        <option value="watchLater">Watch Later</option>
                    </select>
                    <div class="bg-dark">
                        <div class="animeFooter">
                            <h3 class="animeName">${anime.title.romaji}</h3>
                            <div class="bookmark-icon">
                                <a href="" id="bookmarkCardIcon" data-anime-id="${anime.id}">
                                    <i class="bi bi-file-plus-fill"></i>
                                </a>
                                
                            </div>
                        </div>
                    </div>
                </div>
            `;
            animeBookmark.appendChild(animeCard);

            const selectElement = animeCard.querySelector('.anime-status-select');
            db.get(anime.id.toString()).then(function(doc) {
                if (doc.status) {
                    selectElement.value = doc.status;
                }
            });

            // Add event listener to the select element
            selectElement.addEventListener('change', (event) => {
                const selectedStatus = event.target.value;
                updateAnimeStatus(anime.id, selectedStatus);
            });

            const bookmarkButton = animeCard.querySelector('#bookmarkCardIcon');
            bookmarkButton.addEventListener('click', async (event) => {
                event.preventDefault();
                // console.log("Bookmark button clicked")
                await toggleBookmark(anime.id);
            });

            const imageButton = animeCard.querySelector('#imageButton');
            imageButton.addEventListener('click', (event) => {
                event.preventDefault();
                // console.log("animeButton clicked")

                fetchAnimeDetail(anime.id);
                navigate('animeDetailView');
            })
        });
        
    }

    function updateStatusUI(animeId, status) {
        const selectElement = document.querySelector(`.anime-status-select[data-anime-id="${animeId}"]`);
        if (selectElement) {
            selectElement.value = status;
        }
    }

    async function fetchAnimeDetail(IdQuery) {
        const query = `
            query ($id: Int) {
                Media(id: $id, type: ANIME) {
                    id
                    title {
                        romaji
                    }
                    description
                    coverImage {
                        large
                    }
                    characters(sort: ROLE page: 1 perPage: 24) {
                        nodes { # Array of character nodes
                        id
                        name {
                            first
                            middle
                            last
                            full
                        }
                        image {
                            large
                            medium
                        }

                        }
                    }
                    trailer {
                        id
                        site
                        thumbnail
                    }
                    startDate {
                        year
                        month
                        day
    				}
                    endDate {
                        year
                        month
                        day
    				}
                    episodes
                    status
                }
            }
            `;
        const variables = {
            id: IdQuery
        };
    
        fetch('http://localhost:3260/api/anilist', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                variables: variables 
            })
        })
        .then(response => {
            return response.json();
        })
        .then(data => {
            const anime = data.data.Media;
            displayAnimeDetail(anime);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
    }

    function displayAnimeDetail(anime){
        console.log(JSON.stringify(anime.characters.nodes[1]))
        const animeDetailView = document.getElementById("animeDetailView2");
        
        const trailerEmbed = anime.trailer && (anime.trailer.site === "youtube" || anime.trailer.site === "dailymotion" ) ? 
        `<iframe width="100%" height="400" src="https://www.youtube.com/embed/${anime.trailer.id}" frameborder="0" allowfullscreen></iframe>` 
        : "<p>No trailer available</p>";
        const EndDate = anime.endDate.year && anime.endDate.month && anime.endDate.day ?
        `${anime.endDate.month}/${anime.endDate.day}/${anime.endDate.year}`
        : "<p>Not Completed</p>";
        animeDetailView.innerHTML = `
            <div class="container mt-4">
            <div class="row">
                <div class="col-md-3">
                <img src="${anime.coverImage.large}" alt="${anime.title.romaji}" class="img-fluid">
                <button class="btn btn-primary mt-2" id="bookmarkViewButton">Add to Bookmark</button>
                <div class="mt-2">
                    <p><strong>Other Info:</strong></p>
                    <p>Title: ${anime.title.romaji}</p>
                    <p>Episodes: ${anime.episodes || 'Not Completed'}</p>
                    <p>Start Date: ${anime.startDate.month}/${anime.startDate.day}/${anime.startDate.year}</p>
                    <p>End Date:${EndDate}</p>
                    <p>Status: ${anime.status}</p>
                </div>
                </div>
                <div class="col-md-5">
                <h2>Synopsis</h2>
                <p>${anime.description}</p>
                </div>
                <div class="col-md-4">
                <h2>Trailer</h2>
                <div>
                    ${trailerEmbed}
                </div>
                </div>
                <h2 class="mt-4">Characters</h2>
                <div class="row">
                        ${anime.characters.nodes.map(character => `
                            <div class="col-3 mb-3">
                                <div class="card">
                                    <img src="${character.image.large}" alt="${character.name.first}" class="card-img-top">
                                    <div class="card-body text-center">
                                        <p class="card-text">${character.name.first} ${character.name.middle || ''} ${character.name.last || ''}</p>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        const bookmarkButton = animeDetailView.querySelector('#bookmarkViewButton');
            bookmarkButton.addEventListener('click', (event) => {
                event.preventDefault();
                toggleBookmark(anime.id);
                bookmarkedID();
            });
    }

    function clearAnimeDetailView() {
        const animeDetailView = document.getElementById("animeDetailView2");
        animeDetailView.innerHTML = ''; // Clear content to stop the video
    }

    document
        .getElementById("viewAllOne")
        .addEventListener("click", () => {
            navigate("bookmarkView");
        });
            

});
