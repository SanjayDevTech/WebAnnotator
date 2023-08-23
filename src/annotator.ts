import { initializeApp } from "firebase/app";
import {
  getAuth,
  GithubAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getDatabase,
  ref,
  onValue,
  set,
  push,
  child,
  DatabaseReference,
  off,
} from "firebase/database";
import domElementPath from "./dom-element-path.js";
import { safeHost } from "./host.js";
import Observable from "./observable.js";

function annotator() {
  const firebaseConfig = {
    apiKey: "AIzaSyBnne-Ip5UmPeo8LRW3XQUStD4_HT1NRA8",
    authDomain: "web-annotator-js.firebaseapp.com",
    databaseURL: "https://web-annotator-js-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "web-annotator-js",
    storageBucket: "web-annotator-js.appspot.com",
    messagingSenderId: "737690326268",
    appId: "1:737690326268:web:39080c94053f463a2cf379",
    measurementId: "G-J2NLLT96LK"
  };

  const baseCss = `
.__web_annotation_container {
  position: fixed;
  bottom: 5px;
  left: auto;
  right: calc(50% - 7.5em);
  width: 15em;
  height: min-content;
  padding: 10px;
  background-color: green;
  display: flex;
  column-gap: 15px;
  justify-content: center;
}

.__web_annotation_comment {
    position: fixed;
    bottom: 5px;
    right: 5px;
    display: flex;
    flex-direction: column;
    width: 15em;
    padding: 10px;
    background-color: orange;
}

.__web_annotation_comment > div {
    margin: 5px;
    background-color: white;
    
}

.__web_annotation_target {
    border-style: dashed !important;
    border-color: green;
    border-width: 2px;
    border-radius: 3px;
    box-sizing: border-box;
}

.__web_annotation_selected {
    border-style: dashed !important;
    border-color: red;
    border-width: 2px;
    border-radius: 3px;
}`;

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getDatabase(app);

  const provider = new GithubAuthProvider();

  async function signIn() {
    try {
      const result = await signInWithPopup(auth, provider);
      console.log(result.user);
    } catch (error: any) {
      const errorCode = error.code;
      const errorMessage = error.message;
      const email = error.customData.email;
      const credential = GithubAuthProvider.credentialFromError(error);
      console.log(errorCode, errorMessage, email, credential);
    }
  }

  const isStart = new Observable(false);

  const current = new Observable<HTMLElement | null>(null);
  let domElementString: string | null = null;

  const comments = new Observable<any[]>([]);

  function main() {
    const containerClass = "__web_annotation_container";
    const actionClass = "__web_annotation_action";
    const loginClass = "__web_annotation_login";
    const commentClass = "__web_annotation_comment";
    const commentListClass = "__web_annotation_comment_list";
    const commentInputClass = "__web_annotation_comment_input";
    const commentItemClass = "__web_annotation_comment_item";

    // const commentNameClass = "__web_annotation_comment_name";
    // const commentContentClass = "__web_annotation_comment_content";
    // const commentResolveClass = "__web_annotation_comment_resolve";
    // const commentDeleteClass = "__web_annotation_comment_delete";

    const targetClass = "__web_annotation_target";
    const selectedClass = "__web_annotation_selected";

    const commentId = "__web_annotation_comment_container";
    const commentListId = "__web_annotation_comment_list";
    const commentInputId = "__web_annotation_comment_input";

    const styleTag = document.createElement("style");
    styleTag.innerHTML = baseCss;
    document.head.appendChild(styleTag);

    const divTag = document.createElement("div");
    divTag.classList.add(containerClass);
    divTag.append("Web annotation");

    const buttonTag = document.createElement("button");
    buttonTag.classList.add(actionClass);
    buttonTag.append("Start");

    const loginButtonTag = document.createElement("button");
    loginButtonTag.classList.add(loginClass);
    loginButtonTag.append("Login");
    loginButtonTag.addEventListener("click", function () {
      signIn();
    });

    const clearButtonTag = document.createElement("button");
    clearButtonTag.classList.add(actionClass);
    clearButtonTag.append("Clear");
    clearButtonTag.addEventListener("click", function () {
      onClearSelected();
    });

    const commentContainerTag = document.createElement("div");
    commentContainerTag.id = commentId;
    commentContainerTag.classList.add(commentClass);

    const inputTag = document.createElement("input");
    inputTag.type = "text";
    inputTag.id = commentInputId;
    inputTag.classList.add(commentInputClass);

    inputTag.addEventListener("keydown", (e: any) => {
      if (
        e.key !== "Enter" ||
        !current.getValue() ||
        !e.target.value ||
        !e.target.value.trim()
      )
        return;
      if (!auth.currentUser) {
        alert("Please login");
        return;
      }
      const host = safeHost();
      const parentPath = `${host}/${domElementString}`;
      const messageRef = push(child(ref(db), parentPath));
      set(messageRef, {
        mid: messageRef.key,
        uid: auth.currentUser.uid,
        name: auth.currentUser.displayName,
        content: e.target.value.trim(),
      });
      inputTag.value = "";
    });

    let domElementRef: DatabaseReference | null = null;

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
    });

    const excludeElementsList = [
      document.body,
      divTag,
      buttonTag,
      loginButtonTag,
      clearButtonTag,
      commentContainerTag,
      commentListTag,
      inputTag,
    ];
    const excludeClassList = [commentItemClass];
    function excludeElements(element: HTMLElement) {
      return (
        excludeElementsList.includes(element) ||
        excludeClassList.includes(element.className)
      );
    }

    function commentItem(comment: any) {
      // const isMine = auth!.currentUser!.uid === comment.uid;
      return `
                <div class="${commentItemClass}">
                    
                    ${comment.content}

                </div>
            `;
    }

    function onClickAction() {
      if (isStart.getValue()) {
        isStart.postValue(false);
        onClearSelected();
      } else {
        isStart.postValue(true);
      }
    }

    buttonTag.addEventListener("click", function (e) {
      e.preventDefault();
      onClickAction();
    });

    function onElementClick(e: any) {
      onClearSelected();
      if (excludeElements(e.target)) return;
      e.target.classList.add(selectedClass);
      current.postValue(e.target);
    }

    function onClearSelected() {
      const currentValue = current.getValue();
      if (!currentValue || excludeElements(currentValue)) return;
      currentValue.classList.remove(selectedClass);
      current.postValue(null);
    }

    function onMouseOver(e: any) {
      if (excludeElements(e.target)) return;
      e.target.classList.add(targetClass);
      e.target.addEventListener("click", onElementClick);
    }

    function onMouseOut(e: any) {
      if (excludeElements(e.target)) return;
      e.target.classList.remove(targetClass);
      e.target.removeEventListener("click", onElementClick);
    }

    isStart.observe((v) => {
      if (v) {
        buttonTag.innerText = "Stop";
        divTag.appendChild(clearButtonTag);
        document.body.addEventListener("mouseover", onMouseOver);

        document.body.addEventListener("mouseout", onMouseOut);
      } else {
        buttonTag.innerText = "Start";
        clearButtonTag.remove();
        document.body.removeEventListener("mouseover", onMouseOver);

        document.body.removeEventListener("mouseout", onMouseOut);
      }
    });

    async function getComments() {
      const host = safeHost();
      domElementRef = ref(db, `${host}/${domElementString}`);
      onValue(domElementRef, (snapshot) => {
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
        domElementRef && off(domElementRef);
        commentContainerTag.style.display = "none";
        comments.postValue([]);
      }
    });

    comments.observe((c) => {
      commentListTag.innerHTML = c.map(commentItem).join("");
    });

    divTag.appendChild(loginButtonTag);
    divTag.appendChild(buttonTag);
    document.body.appendChild(divTag);
    document.body.appendChild(commentContainerTag);
  }

  window.onload = function () {
    main();
  };
  
}

export default annotator;
