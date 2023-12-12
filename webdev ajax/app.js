document.addEventListener("DOMContentLoaded", function () {
    const postsContainer = document.getElementById("posts");
    const addPostButton = document.getElementById("addPost");
    const modal = document.getElementById("modal");
    const closeModalButton = document.getElementById("closeModal");
    const postForm = document.getElementById("postForm");
    const userIdSelect = document.getElementById("userId");
    const toggleThemeButton = document.getElementById("toggleTheme");
    const openCreatePostModalButton = document.getElementById("openCreatePostModal");
    var postsToDisplay = [];
    var usersList;

    let isDarkTheme = localStorage.getItem("theme") === "dark";
    let deletedPostIds = []; // Maintain a list of deleted post IDs
    let localPosts = [];

    // Function to toggle between dark and light themes
    function toggleTheme() {
        isDarkTheme = !isDarkTheme;
        document.body.classList.toggle("dark-theme", isDarkTheme);
        localStorage.setItem("theme", isDarkTheme ? "dark" : "light");
    }

    // Function to fetch and display posts
    function fetchAndDisplayPosts() {
        fetch("https://jsonplaceholder.typicode.com/posts")
            .then(response => response.json())
            .then(posts => {
                posts = posts.filter(post => !deletedPostIds.includes(post.id)); // Exclude deleted posts

                posts.sort((a, b) => {
                    // Sort by importance (stored in localStorage)
                    const isImportantA = localStorage.getItem(`important_${a.id}`);
                    const isImportantB = localStorage.getItem(`important_${b.id}`);

                    if (isImportantA && !isImportantB) {
                        return -1;
                    } else if (!isImportantA && isImportantB) {
                        return 1;
                    } else {
                        // If both or neither are important, sort by ID (default order)
                        return a.id - b.id;
                    }
                });

                postsToDisplay = posts;

                postsContainer.innerHTML = "";
                posts.forEach(post => {
                    const postElement = createPostElement(post);
                    postsContainer.appendChild(postElement);
                });
            })
            .catch(error => console.error("Error fetching posts:", error));
    }

    // Function to create an HTML element for a post
    function createPostElement(post) {
        const postElement = document.createElement("div");
        postElement.id = `post_${post.id}`; // Set a unique id for each post element
        
        // Fetch user data to get the author's name
        fetch(`https://jsonplaceholder.typicode.com/users/${post.userId}`)
            .then(response => response.json())
            .then(user => {
                postElement.innerHTML = `<h2>${post.title}</h2><p><textArea style="max-width:90%; max-height:200px; height:199px;" readonly id=${post.id}>${post.body}</textArea></p><p>Author: ${user.name}</p>`;
        
                const deleteButton = document.createElement("button");
                deleteButton.textContent = "Delete";
                deleteButton.addEventListener("click", () => deletePost(post.id));
        
                const importantButton = document.createElement("button");
                importantButton.textContent = localStorage.getItem(`important_${post.id}`) ? "Unmark Important" : "Mark Important";
                importantButton.addEventListener("click", () => toggleImportance(post.id));
                
                const editButton = document.createElement("button");
                editButton.textContent = "Edit";
                editButton.addEventListener("click", () => editPost(post.id));

                // Add some space between buttons using CSS
                deleteButton.style.marginRight = "8px"; // Adjust the value as needed
                importantButton.style.marginRight = "8px"; // Adjust the value as needed
        
                postElement.appendChild(deleteButton);
                postElement.appendChild(importantButton);
                postElement.appendChild(editButton);
        
                // Apply a different color to important posts
                if (localStorage.getItem(`important_${post.id}`)) {
                    postElement.style.backgroundColor = "#ffd700"; // Change this to the desired color
                }
            })
            .catch(error => console.error("Error fetching user data:", error));
    
        return postElement;
    }

    //func to edit/save post
    function editPost(postId){
        if (document.getElementById(postId).hasAttribute('readonly')) {
            document.getElementById(postId).removeAttribute('readonly')
          } else {
            document.getElementById(postId).setAttribute('readonly', 'readonly');
          }
    }
    
////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Function to delete a post
    function deletePost(postId) {
        const isImportant = localStorage.getItem(`important_${postId}`);

        // Ask for confirmation only for important posts
        if (isImportant && !confirm("Are you sure you want to delete this important post?")) {
            return;
        }

        // Remove the post element from the page
        const postElement = document.getElementById(`post_${postId}`);
        if (postElement) {
            postElement.remove();
        }

        // Add the deleted post ID to the list
        deletedPostIds.push(postId);
    }
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Function to toggle the importance of a post
    function toggleImportance(postId) {
        const isImportant = localStorage.getItem(`important_${postId}`);
        localStorage.setItem(`important_${postId}`, isImportant ? "" : "true");
    
        // Reorder posts based on importance
        postsToDisplay.sort((a, b) => {
            const isImportantA = localStorage.getItem(`important_${a.id}`);
            const isImportantB = localStorage.getItem(`important_${b.id}`);
    
            if (isImportantA && !isImportantB) {
                return -1;
            } else if (!isImportantA && isImportantB) {
                return 1;
            } else {
                // If both or neither are important, maintain the existing order
                return postsToDisplay.indexOf(a) - postsToDisplay.indexOf(b);
            }
        });
    
        // Update the displayed posts
        postsContainer.innerHTML = "";
        postsToDisplay.forEach(post => {
            const postElement = createPost2(post);
            postsContainer.appendChild(postElement);
        });
    }
    
    // Function to open the modal for creating/editing posts
    function openModal() {
        modal.style.display = "block";
        fetchUserIds();
    }

    // Function to close the modal
    function closeModal() {
        modal.style.display = "none";
    }

    // Function to fetch and populate the dropdown list of authors
    function fetchUserIds() {
        fetch("https://jsonplaceholder.typicode.com/users")
            .then(response => response.json())
            .then(users => {
                userIdSelect.innerHTML = "";
                usersList = users;
                users.forEach(user => {
                    const option = document.createElement("option");
                    option.value = user.id;
                    option.textContent = user.name;
                    userIdSelect.appendChild(option);
                });
            })
            .catch(error => console.error("Error fetching users:", error));
    }

    // Event listeners
    addPostButton.addEventListener("click", openModal);
    openCreatePostModalButton.addEventListener("click", openModal);
    closeModalButton.addEventListener("click", closeModal);
    toggleThemeButton.addEventListener("click", toggleTheme);

    // Form submission
    postForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const title = document.getElementById("title").value;
        const body = document.getElementById("body").value;
        const userId = userIdSelect.value;

        // Call a function to create the post with the provided data
        createPost(title, body, userId);

        closeModal();
    });

    // Set the initial theme
    toggleTheme();

    // Initial fetch and display posts
    fetchAndDisplayPosts();

    // Fetch and populate the dropdown list of authors
    fetchUserIds();

    // Function to create a new post locally
    function createPost(title, body, userId) {
        // Prepare the new post data
        const newPost = {
            userId: userId,
            title: title,
            body: body,
            id: Date.now(), // Using a timestamp as a temporary unique ID
        };

        // Update the localPosts array
        localPosts.unshift(newPost);

        postsToDisplay.splice(0,0,newPost)
        // Create the HTML element for the new post
        const newPostElement = createPostElement(newPost);

        // Insert the new post at the beginning of the posts container
        postsContainer.insertBefore(newPostElement, postsContainer.firstChild);
    }


    function createPost2(post) {
        const postElement = document.createElement("div");
        postElement.id = `post_${post.id}`; // Set a unique id for each post element
    
        postElement.innerHTML = `<h2>${post.title}</h2><p><textarea style="max-width:90%; max-height:200px; height:199px;" readonly id=${post.id}>${post.body}</textarea></p><p>Author: ${getUserInfo(post.userId)}</p>`;
    
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => deletePost(post.id));
    
        const importantButton = document.createElement("button");
        importantButton.textContent = localStorage.getItem(`important_${post.id}`) ? "Unmark Important" : "Mark Important";
        importantButton.addEventListener("click", () => toggleImportance(post.id));
    
        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => editPost(post.id));
    
        // Add some space between buttons using CSS
        deleteButton.style.marginRight = "8px"; // Adjust the value as needed
        importantButton.style.marginRight = "8px"; // Adjust the value as needed
    
        postElement.appendChild(deleteButton);
        postElement.appendChild(importantButton);
        postElement.appendChild(editButton);
    
        // Apply a different color to important posts
        if (localStorage.getItem(`important_${post.id}`)) {
            postElement.style.backgroundColor = "#ffd700"; // Change this to the desired color
        }
    
        return postElement;
    }
    
    function getUserInfo(userId) {

        const user = usersList.filter(user => user.id == userId);
        return user ? user[0].name : "Unknown User";
    }
    
});