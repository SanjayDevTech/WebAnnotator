import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.4/firebase-app.js";
import { getAuth, GithubAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.8.4/firebase-auth.js";
import { getDatabase, ref, onValue, set, push, child } from "https://www.gstatic.com/firebasejs/9.8.4/firebase-database.js";
import "./dom-element-path.js";
import domElementPath from "./dom-element-path.js";
(function () {

    const firebaseConfig = {
        apiKey: "AIzaSyDeYJ8cscOm3I4kn6Nq2wFWS_WQCctVN9w",
        authDomain: "web-annotator-123.firebaseapp.com",
        projectId: "web-annotator-123",
        storageBucket: "web-annotator-123.appspot.com",
        messagingSenderId: "313496327840",
        appId: "1:313496327840:web:652fdde1d4b02f3dc0dbc5",
        databaseURL: "web-annotator-123-default-rtdb.firebaseio.com",
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getDatabase(app);
    
    const provider = new GithubAuthProvider();

    async function signIn() {
        try {
            const result = await signInWithPopup(auth, provider);
        } catch(error) {
            const errorCode = error.code;
            const errorMessage = error.message;
            const email = error.customData.email;
            const credential = GithubAuthProvider.credentialFromError(error);
            console.log(errorCode, errorMessage, email, credential);
        }
    }

    class Observable {
        constructor(value) {
            this.value = value;
            this.observers = [];
            this.observe = this.observe.bind(this);
            this.postValue = this.postValue.bind(this);
            this.remove = this.remove.bind(this);
            this.getValue = this.getValue.bind(this);
        }
        observe(cb) {
            this.observers.push(cb);
        }

        remove(cb) {
            this.observers = this.observers.filter(v => v !== cb);
        }

        postValue(value) {
            if (this.value === value) return;
            this.value = value;
            this.observers.forEach(cb => cb(value));
        }

        getValue() {
            return this.value;
        }
    }


    const isStart = new Observable(false);

    const current = new Observable(null);
    let domElementString = null;

    const comments = new Observable([]);

    function main() {

        const containerClass = "__web_annotation_container";
        const actionClass = "__web_annotation_action";
        const loginClass = "__web_annotation_login";
        const commentClass = "__web_annotation_comment";
        const commentListClass = "__web_annotation_comment_list";
        const commentInputClass = "__web_annotation_comment_input";
        const commentItemClass = "__web_annotation_comment_item";

        const commentNameClass = "__web_annotation_comment_name";
        const commentContentClass = "__web_annotation_comment_content";
        const commentResolveClass = "__web_annotation_comment_resolve";
        const commentDeleteClass = "__web_annotation_comment_delete";

        const targetClass = "__web_annotation_target";
        const selectedClass = "__web_annotation_selected";

        const commentId = "__web_annotation_comment_container";
        const commentListId = "__web_annotation_comment_list";
        const commentInputId = "__web_annotation_comment_input";

        const linkTag = document.createElement('link');
        linkTag.rel = "stylesheet";
        linkTag.href = "./annotation.css";
        document.head.appendChild(linkTag);

        const divTag = document.createElement("div");
        divTag.classList.add(containerClass);
        divTag.append("Web annotation");

        const buttonTag = document.createElement("button");
        buttonTag.classList.add(actionClass);
        buttonTag.append("Start");

        const loginButtonTag = document.createElement('button');
        loginButtonTag.classList.add(loginClass);
        loginButtonTag.append("Login");
        loginButtonTag.addEventListener('click', function(e) {
            signIn();
        });

        const commentContainerTag = document.createElement("div");
        commentContainerTag.id = commentId;
        commentContainerTag.classList.add(commentClass);

        const inputTag = document.createElement('input');
        inputTag.type = "text";
        inputTag.id = commentInputId;
        inputTag.classList.add(commentInputClass);

        inputTag.addEventListener('keydown', e => {
            if (e.key !== "Enter" || !current.getValue() || !e.target.value || !e.target.value.trim()) return;
            if (!auth.currentUser) {
                alert("Please login");
                return;
            }
            const host = window.location.host;
            const parentPath = `${host}/${domElementString}`;
            const messageRef = push(child(ref(db),parentPath));
            set(messageRef, {
                mid: messageRef.key,
                uid: auth.currentUser.uid,
                name: auth.currentUser.displayName,
                content: e.target.value.trim(),
              });
            inputTag.value = "";
        });

        let domElementRef = null;

        const commentListTag = document.createElement("div");
        commentListTag.id = commentListId;
        commentListTag.classList.add(commentListClass);
        commentContainerTag.appendChild(commentListTag);
        commentContainerTag.appendChild(inputTag);
        
        commentContainerTag.style.display = "none";
        
        
        onAuthStateChanged(auth, (user) => {
            if (user) {
                loginButtonTag.style.display = "none";
            } else {
                loginButtonTag.style.display = "block";
            }
        })

        const excludeElementsList = [document.body, divTag, buttonTag, loginButtonTag, commentContainerTag, commentListTag, inputTag];
        const excludeClassList = [commentItemClass];
        function excludeElements(element) {
            return excludeElementsList.includes(element) || excludeClassList.includes(element.className)
        }

        function commentItem(comment) {
            const isMine = auth.currentUser.uid === comment.uid;
            return `
                <div class="${commentItemClass}">
                    
                    ${comment.content}

                </div>
            `
        }

        function onClickAction() {
            if (isStart.getValue()) {
                isStart.postValue(false);
                onClearSelected();
            } else {
                isStart.postValue(true);
            }
        }

        buttonTag.addEventListener('click', function (e) {
            e.preventDefault();
            onClickAction();
        });



        function onElementClick(e) {
            onClearSelected();
            if (excludeElements(e.target)) return;
            e.target.classList.add(selectedClass);
            current.postValue(e.target);
        }

        function onClearSelected() {
            if (!current.getValue() || excludeElements(current.getValue())) return;
            current.getValue().classList.remove(selectedClass);
            current.postValue(null);
        }

        function onMouseOver(e) {
            if (excludeElements(e.target)) return;
            e.target.classList.add(targetClass);
            e.target.addEventListener('click', onElementClick);
        }

        function onMouseOut(e) {
            if (excludeElements(e.target)) return;
            e.target.classList.remove(targetClass);
            e.target.removeEventListener('click', onElementClick);
        }

        isStart.observe(v => {
            if (v) {
                buttonTag.innerText = "Stop";
                document.body.addEventListener('mouseover', onMouseOver)

                document.body.addEventListener('mouseout', onMouseOut)
            }
            else {
                buttonTag.innerText = "Start";
                document.body.removeEventListener('mouseover', onMouseOver)

                document.body.removeEventListener('mouseout', onMouseOut)
            }
        });

        async function getComments() {
            const host = window.location.host;
            domElementRef = ref(db, `${host}/${domElementString}`);
            onValue(domElementRef, snapshot => {
                const messagesObject = snapshot.val();
                if (!messagesObject) return;
                const messages = Object.values(messagesObject);
                comments.postValue(messages);
            });
        }

        current.observe((v) => {
            if (v) {
                domElementString = domElementPath(v);
                commentContainerTag.style.display = "unset";
                comments.postValue([]);
                getComments();
            } else {
                domElementString = null;
                domElementRef?.off?.();
                commentContainerTag.style.display = "none";
                comments.postValue([]);
            }
        });

        comments.observe(c => {
            commentListTag.innerHTML = c.map(commentItem).join("");
        })

        divTag.appendChild(loginButtonTag);
        divTag.appendChild(buttonTag);
        document.body.appendChild(divTag);
        document.body.appendChild(commentContainerTag);
    }

    window.onload = function () {
        main()
    }


})();