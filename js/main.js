let currentFeedEndpoint = '/feeds';
const limit = 10;
let loading = false; // 초기화
let done = false;
const loadedFeedIds = new Set();
  

class EmojiButton {
  constructor(options = {}) {
    this.options = options;
    this.picker = document.createElement('div');
    this.picker.classList.add('emoji-button');

    // ✅ 기본 스타일
    Object.assign(this.picker.style, {
      position: 'absolute',
      display: 'none',
      flexWrap: 'wrap',
      gap: '6px',
      background: '#fff',
      border: '1px solid #ccc',
      padding: '8px',
      borderRadius: '10px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      zIndex: '9999',
      width: '200px',           // ✅ 고정 너비
      maxHeight: '160px',       // ✅ 스크롤을 위한 최대 높이
      overflowY: 'auto',
      boxSizing: 'border-box',
      fontSize: '20px',
    });

    // ✅ 이모지 목록
    const emojis = ['😀','😅','😂','🤣','😊','😍','😘','😎','😢','😭','😡','🤔','👍','👎','👏','🙏','💪','🔥','🎉','❤️'];
    emojis.forEach(emoji => {
      const btn = document.createElement('button');
      btn.textContent = emoji;
      Object.assign(btn.style, {
        width: '30px',
        height: '30px',
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        padding: '0',
      });

      btn.addEventListener('click', () => {
        if (this._onEmoji) this._onEmoji(emoji);
        this.hidePicker();
      });

      this.picker.appendChild(btn);
    });
  }

  on(event, callback) {
    if (event === 'emoji') {
      this._onEmoji = callback;
    }
  }

  togglePicker(trigger) {
  const rect = trigger.getBoundingClientRect();
  const parent = trigger.parentElement;

  if (getComputedStyle(parent).position === 'static') {
    parent.style.position = 'relative';
  }

  if (!this.picker.parentElement) {
    parent.appendChild(this.picker);
  }

  const parentRect = parent.getBoundingClientRect();
  let left = rect.left - parentRect.left;
  const top = rect.bottom - parentRect.top + 8;

  // ✅ 피커가 오른쪽을 넘는 경우 → 왼쪽으로 보정
  const pickerWidth = 200; // 이모지 박스 너비
  const maxLeft = parent.clientWidth - pickerWidth;
  if (left > maxLeft) {
    left = maxLeft;
  }
  if (left < 0) {
    left = 0; // 음수로 넘어가지 않도록
  }

  this.picker.style.left = `${left}px`;
  this.picker.style.top = `${top}px`;
  this.picker.style.display = (this.picker.style.display === 'none') ? 'flex' : 'none';
}


  hidePicker() {
    this.picker.style.display = 'none';
  }
}


  
const api = 'https://supermax.kr/feed';


// ✅ 피드 업로드 완료 메시지 체크
const pendingUpload = localStorage.getItem("pendingUpload");
if (pendingUpload === "true") {
  setTimeout(() => {
    showToast("✅ 피드 업로드 완료!");
    localStorage.removeItem("pendingUpload");
  }, 1500);
}

// ✅ 토스트 함수 정의
function showToast(msg) {
  const toast = document.createElement('div');
  toast.innerText = msg;
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.background = "rgba(33, 33, 33, 0.85)";
toast.style.backdropFilter = "blur(6px)";
toast.style.fontSize = "0.95rem";
toast.style.fontWeight = "500";

  toast.style.color = '#fff';
  toast.style.padding = '10px 20px';
  toast.style.borderRadius = '8px';
  toast.style.zIndex = 9999;
  toast.style.opacity = 0;
  document.body.appendChild(toast);

  setTimeout(() => { toast.style.transition = 'opacity 0.3s'; toast.style.opacity = 1; }, 10);
  setTimeout(() => { toast.style.opacity = 0; setTimeout(() => toast.remove(), 300); }, 2000);
}

let page = 1;


const observer = new IntersectionObserver(async (entries) => {
  if (entries[0].isIntersecting && !loading && !done) {
    loading = true;
    console.log("🌀 무한스크롤 triggered, page:", page);
    await loadFeeds(currentFeedEndpoint, page);
    loading = false;
  }
}, { threshold: 1 });

observer.observe(document.getElementById('scroll-anchor'));



init(); // ✅ 초기 실행









async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const res = await fetch(`${api}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    if (res.ok) {
        const data = await res.json();
        console.log("✅ 로그인 성공, 응답 데이터:", data);

        if (data.user_id !== undefined && data.user_id !== null) {  
            localStorage.setItem('token', data.token);
            localStorage.setItem('user_id', String(data.user_id));  // ✅ user_id 저장
            console.log("🚀 `user_id` 저장 시도:", data.user_id);

            // ✅ 저장 후 100ms 뒤에 다시 확인 (Chrome 버그 방지)
            setTimeout(() => {
                const savedUserId = localStorage.getItem("user_id");
                console.log("✅ 저장 후 확인 user_id:", savedUserId);

                if (savedUserId && savedUserId !== "undefined") {
                    console.log("✅ `user_id` 저장 성공!");
                    checkUser();  // ✅ 네비게이션 업데이트
                    location.href = 'index.html';  // ✅ 페이지 이동
                } else {
                    console.error("❌ `user_id` 저장 실패! LocalStorage 확인 필요");
                }
            }, 100);
        } else {
            console.error("❌ 서버 응답에 user_id 없음:", data);
            alert("로그인 실패: user_id가 없습니다.");
        }
    } else {
        console.error("❌ 로그인 실패:", res.status);
        alert("로그인 실패");
    }
}





console.log("🛠 페이지 로드됨 - LocalStorage 확인");
console.log("🔹 현재 저장된 token:", localStorage.getItem('token'));
console.log("🔹 현재 저장된 user_id:", localStorage.getItem('user_id'));





// ✅ 로그인 상태 확인 및 네비게이션 바 업데이트
async function checkUser() {
    const token = localStorage.getItem('token');
    let userId = localStorage.getItem('user_id');

    if (!token) return;  // ✅ 토큰이 없으면 로그인하지 않은 상태

    try {
        const res = await fetch(`${api}/user-info`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (res.ok) {
            const data = await res.json();

            // ✅ user_id가 `undefined`, `"null"`, `"undefined"`이면 덮어쓰기
            if (!userId || userId === "null" || userId === "undefined") {
                console.log("⚠️ `user_id`가 이상함, 서버 데이터로 덮어쓰기:", data.user_id);
                localStorage.setItem('user_id', String(data.user_id));
                userId = localStorage.getItem('user_id'); // 다시 가져오기
            }

            console.log("✅ 최종 확인 user_id:", userId);

            // ✅ 네비게이션 UI 업데이트
            const userName = data.name || "사용자";
            const profileImage = data.profile_image || "https://placehold.co/40x40";

            const userInfoEl = document.getElementById('user-info');
            if (userInfoEl) {
              userInfoEl.innerHTML = `
                <div class="profile-info">
                  <img src="${profileImage}">
                  <strong>${userName}</strong>
                </div>
              `;
            }
            
            const loginBtn = document.getElementById('login-btn');
            const registerBtn = document.getElementById('register-btn');
            const logoutBtn = document.getElementById('logout-btn');
            const profileBtn = document.getElementById('profile-btn');
            
            if (loginBtn) loginBtn.style.display = 'none';
            if (registerBtn) registerBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'inline';
            if (profileBtn) profileBtn.style.display = 'inline';
            
        } else {
            console.error("❌ 사용자 정보 불러오기 실패:", res.status);
        }
    } catch (error) {
        console.error("❌ checkUser() 오류:", error);
    }
}




// ✅ 로그아웃 처리
function logout() {
    console.log("🚀 로그아웃 실행!");

    localStorage.removeItem('token');  
    localStorage.removeItem('user_id');

    console.log("✅ 로그아웃 후 LocalStorage 상태:");
    console.log("🔹 token:", localStorage.getItem('token')); // null이어야 정상
    console.log("🔹 user_id:", localStorage.getItem('user_id')); // null이어야 정상

    // ✅ 50ms 후 새로고침 (캐싱 문제 방지)
    setTimeout(() => {
        location.reload();
    }, 50);
}

function getRelativeTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
// getRelativeTime 함수 내
const serverTimeOffset = -3 * 60; // 3분 차이 나는 경우 (초 단위)
const diff = ((now - date) / 1000) + serverTimeOffset;

  

  if (isNaN(diff)) return ""; // 🔥 날짜가 없을 경우 빈값 반환

  if (diff < 120) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;

  return date.toLocaleDateString();
}








// ✅ 피드 삭제 기능
async function deleteFeed(feedId) {
  if (!confirm("이 피드를 삭제하시겠습니까?")) return;

  const token = localStorage.getItem('token');
  if (!token) {
    alert("로그인이 필요합니다.");
    return;
  }

  try {
    const res = await fetch(`${api}/delete-feed`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ feed_id: feedId })
    });

    if (res.ok) {
      showToast("피드가 삭제되었습니다!");
      setTimeout(() => {
        location.href = 'index.html';
      }, 500); // UX상 토스트 살짝 보여주고 이동
    } else {
      const err = await res.json();
      alert("❌ 삭제 실패: " + (err.error || '알 수 없는 오류'));
    }
  } catch (e) {
    console.error("🔥 삭제 오류:", e);
    alert("삭제 중 오류 발생");
  }
}


// ✅ loadUserFeeds 정리
async function loadUserFeeds(userId, userName) {
  currentFeedEndpoint = `/user-feeds/${userId}`;
  currentUserName = userName;
  resetFeedState(currentFeedEndpoint); // 상태 초기화 및 feeds 영역 비우기
  
  page = 1;
  done = false;
  loading = false;

  const feedsDiv = document.getElementById('feeds');
  const titleEl = document.getElementById('feeds-title');

  feedsDiv.innerHTML = '';
  titleEl.innerText = `👤 ${userName}님의 Stack`;
  await loadFeeds(currentFeedEndpoint); // 여기에서 DOM 업데이트 완료됨

  // 불필요한 feeds 참조 코드를 제거합니다.
  // setupVideoObservers 및 페이지 증가 작업만 남깁니다.
  setupVideoObservers();
  page++;  // 페이지 증가 (다음 무한스크롤 대비)
}




async function likeComment(commentId) {
  const token = localStorage.getItem('token');
  if (!token) {
    alert("로그인이 필요합니다.");
    return;
  }

  const res = await fetch(`${api}/like-comment`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ comment_id: commentId })
  });

  if (!res.ok) {
    const text = await res.text(); // 👈 문제의 HTML일 수도 있음
    console.error("❌ 서버 오류:", text);
    alert("댓글 좋아요 실패");
    return;
  }

  const data = await res.json(); // 👈 여기서 오류 발생한 것!
  console.log("✅ 좋아요 응답:", data);

  // ✅ 좋아요 버튼 업데이트
  const btn = document.querySelector(`#comment-${commentId} .like-comment-btn`);
  if (btn) {
    btn.classList.toggle('liked', data.liked);
    btn.innerText = `❤️ ${data.like_count}`;
  }
}






function showToast(msg) {
  const toast = document.createElement('div');
  toast.innerText = msg;
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.background = '#333';
  toast.style.color = '#fff';
  toast.style.padding = '10px 20px';
  toast.style.borderRadius = '8px';
  toast.style.zIndex = 9999;
  toast.style.opacity = 0;
  document.body.appendChild(toast);

  setTimeout(() => { toast.style.transition = 'opacity 0.3s'; toast.style.opacity = 1; }, 10);
  setTimeout(() => { toast.style.opacity = 0; setTimeout(() => toast.remove(), 300); }, 2000);
}


// ✅ 좋아요 버튼 업데이트
async function likeFeed(feedId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("로그인이 필요합니다.");
        return;
    }

    try {
        console.log(`🚀 좋아요 요청 시작 (feedId=${feedId})`);

        const res = await fetch(`${api}/like`, {
            method: 'POST',
            headers: { 
                'Authorization': 'Bearer ' + token, 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ feed_id: feedId })
        });

        if (!res.ok) {
            console.error(`🔥 좋아요 요청 실패: ${res.status}`);
            alert(`좋아요 요청 실패 (${res.status})`);
            return;
        }

        const data = await res.json();
        console.log("✅ 좋아요 응답 데이터:", data);

        // ✅ 좋아요 버튼 UI 업데이트
        const likeBtn = document.getElementById(`like-btn-${feedId}`);
        if (likeBtn) {
            likeBtn.classList.toggle("liked", data.liked);
            likeBtn.innerText = `❤️ ${data.like_count}`;
        }

    } catch (error) {
        console.error("🔥 좋아요 오류:", error);
        alert("좋아요 요청 중 오류 발생");
    }
}



// ✅ 댓글 불러오기
async function commentFeed(feedId, forceOpen = false) {
  const commentsDiv = document.getElementById(`comments-${feedId}`);

  if (!forceOpen && commentsDiv.innerHTML.trim() !== "") {
    commentsDiv.innerHTML = "";
    return;
  }

  const res = await fetch(`${api}/comments/${feedId}`);
  if (!res.ok) {
    commentsDiv.innerHTML = "<p>❌ 댓글을 불러올 수 없습니다.</p>";
    return;
  }

  const comments = await res.json();
  const userId = localStorage.getItem('user_id');

  // 👉 댓글을 부모와 대댓글로 분리
  const parents = comments.filter(c => !c.parent_id);
  const replies = comments.filter(c => c.parent_id);

  let commentHTML = "";

  // ✅ 댓글 입력창 먼저 추가!
commentHTML += `
  <div style="margin-bottom: 10px;">
    <!-- 댓글 입력줄 -->
    <div class="emoji-trigger-wrapper" style="display: flex; align-items: center; gap: 6px;">
      <input type="text" id="comment-input-${feedId}" placeholder="댓글 입력..." style="flex: 1;">
    </div>

    <!-- 아이콘 버튼 줄 -->
    <div style="display: flex; align-items: center; gap: 10px; font-size: 1.2rem; margin-top: 4px;">
      <label for="comment-file-${feedId}" style="cursor: pointer;">📷</label>
      <input type="file" id="comment-file-${feedId}" accept="image/*,video/*" style="display: none;">
      <span onclick="setupEmojiPicker('comment-input-${feedId}', this)" style="cursor: pointer;">😊</span>
      <span onclick="addComment(${feedId})" style="cursor: pointer;">✏️</span>
    </div>

    <!-- ✅ 프리뷰는 반드시 flex 바깥 -->
    <div id="preview-${feedId}" class="comment-media" style="margin-top: 5px;"></div>

    <!-- 이모지 박스 -->
    <div id="emoji-picker-comment-input-${feedId}" class="emoji-picker"></div>
  </div>
`;


  
  // ✅ 댓글 목록 추가 (이전 forEach 위치 그대로 유지)
  parents.forEach(parent => {
    commentHTML += renderComment(parent);
  
    const childReplies = replies.filter(reply => reply.parent_id === parent.id);
    childReplies.forEach(reply => {
      commentHTML += renderComment(reply);
    });
  });

  
  commentsDiv.innerHTML = commentHTML;
  setupFilePreviewListener(); // ✅ 댓글창 다 만든 다음!

  

  // 👉 댓글 렌더링 함수
  function renderComment(comment) {
    const isDeleted = comment.deleted == 1;
    const liked = comment.liked;
    const likeCount = comment.like_count || 0;
  
    html = `
    <div class="comment-wrapper ${comment.parent_id ? 'reply' : ''}" id="comment-wrapper-${comment.id}">
      <div class="comment-box">
        <div class="comment" id="comment-${comment.id}">
          <div class="comment-left">
            <strong class="clickable-user" onclick="location.href='profile-feed.html?userId=${comment.user_id}'">
              ${comment.name}
            </strong>
              <span class="comment-content">
                ${isDeleted ? '<em style="color:#999;">삭제된 댓글입니다.</em>' : comment.content}
              </span>
              ${!isDeleted ? `
                <div class="comment-actions">
                  <button class="reply-btn" onclick="toggleReplyInput(${comment.id}, ${comment.feed_id})">💬 답글</button>
<button id="comment-like-${comment.id}" class="like-comment-btn ${liked ? 'liked' : ''}" onclick="likeComment(${comment.id})">
  ❤️ <span>${likeCount}</span>
</button>

                </div>
              ` : ''}
            </div>
            ${!isDeleted && userId == comment.user_id ? `
              <div class="comment-right">
                <button class="delete-btn" onclick="deleteComment(${comment.id}, ${comment.feed_id})">❌</button>
              </div>` : ''}
          </div>`;
  
    // ✅ 미디어가 있으면 댓글 박스 안에 묶기
    if (!isDeleted && comment.media_url) {
      html += `
          <div class="comment-media">
            ${comment.media_url.includes('.mp4')
              ? `<video controls src="${comment.media_url}" style="max-width: 300px;"></video>`
              : `<img src="${comment.media_url}" style="max-width: 300px;">`}
          </div>
      `;
    }
  
    html += `
        </div> <!-- .comment-box -->
  
        <!-- 대댓글 입력창은 박스 바깥에 있어야 기능됨 -->
        <div id="reply-container-${comment.id}" class="reply-container"></div>
  
      </div> <!-- .comment-wrapper -->
    `;
  
    return html;
  }
  
  
  
  

  // 👉 부모 댓글 밑에 대댓글 순서대로 출력
  parents.forEach(parent => {
    commentHTML += renderComment(parent);

    const childReplies = replies.filter(reply => reply.parent_id === parent.id);
    childReplies.forEach(reply => {
      commentHTML += renderComment(reply);
    });
  });


}



// ✅ 댓글삭제.
async function deleteComment(commentId, feedId) {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("로그인이 필요합니다.");
        return;
    }

    if (!confirm("댓글을 삭제하시겠습니까?")) return; // 🔥 삭제 확인

    const res = await fetch(`${api}/delete-comment`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment_id: commentId })
    });

    if (res.ok) {
        console.log(`✅ 댓글 ${commentId} 삭제됨!`);

        // 🔥 삭제 후 댓글 다시 불러오기
        commentFeed(feedId, true);

        // 🔥 댓글 카운트 다시 가져오기
        updateCommentCount(feedId);
    } else {
        alert("❌ 댓글 삭제 실패!");
    }
}

 async function updateCommentCount(feedId) {
    try {
        const res = await fetch(`${api}/comments/${feedId}`);
        if (!res.ok) throw new Error("서버 응답 오류");

        const comments = await res.json();
        const newCommentCount = comments.length; // 🔥 현재 댓글 개수 확인

        // 🔥 댓글 개수 업데이트
        document.getElementById(`comment-count-${feedId}`).innerText = newCommentCount;
        console.log(`🔄 댓글 개수 업데이트됨: ${newCommentCount}`);

    } catch (error) {
        console.error("❌ 댓글 개수 업데이트 실패:", error);
    }
}








// ✅ 답글 입력창 토글 (대댓글 입력창을 클릭한 댓글 아래에 표시)
function toggleReplyInput(commentId, feedId) {
    const replyContainer = document.getElementById(`reply-container-${commentId}`);

    // ✅ 입력창이 이미 있으면 삭제 (토글 기능)
    if (replyContainer.innerHTML.trim() !== "") {
        replyContainer.innerHTML = "";
        return;
    }

    // ✅ 입력창을 기존 댓글 아래에 바로 삽입
    replyContainer.innerHTML = `
    <div class="reply-input-wrapper" style="margin-top: 6px;">
      <!-- 입력창 -->
      <input type="text" id="reply-input-field-${commentId}" placeholder="답글 입력..." 
        style="width: 100%; padding: 6px 8px; font-size: 0.9rem; border: 1px solid #ccc; border-radius: 6px;">
  
      <!-- 버튼줄 -->
      <div style="display: flex; align-items: center; gap: 10px; margin-top: 4px; font-size: 1.2rem;">
        <label for="reply-media-${commentId}" style="cursor: pointer;">📷</label>
        <input type="file" id="reply-media-${commentId}" accept="image/*,video/*" style="display: none;">

        <span onclick="setupEmojiPicker('reply-input-field-${commentId}', this)" style="cursor: pointer;">😊</span>
        <span onclick="addComment(${feedId}, ${commentId})" style="cursor: pointer;">✏️</span>
      </div>
  
      <!-- ✅ 프리뷰는 flex 밖으로 따로! -->
      <div id="reply-preview-${commentId}" class="comment-media" style="margin-top: 5px;"></div>
  
      <!-- 이모지 박스 -->
      <div id="emoji-picker-reply-input-field-${commentId}" class="emoji-picker"></div>
    </div>
  `;
  
  
setupFilePreviewListener(); // ✅ 댓글창 다 만든 다음!




}

// ✅ 댓글 추가 후 카운트 업데이트
// ✅ 댓글 추가 API 요청
async function addComment(feedId, parentId = null) {
  const token = localStorage.getItem('token');
  if (!token) {
    alert("로그인이 필요합니다.");
    return;
  }

  // ✅ parentId가 있는 경우 → 대댓글
  const inputId = parentId ? `reply-input-field-${parentId}` : `comment-input-${feedId}`;
  const fileInputId = parentId ? `reply-media-${parentId}` : `comment-file-${feedId}`;
  const previewId = parentId ? `reply-preview-${parentId}` : `preview-${feedId}`;

  const content = document.getElementById(inputId)?.value;
  const fileInput = document.getElementById(fileInputId);
  const file = fileInput?.files?.[0];

  if (!content && !file) {
  showToast("❗️내용또는 미디어 파일 넣어주세요.!");
  return;
}


  const formData = new FormData();
  formData.append('feed_id', feedId);
  if (parentId) formData.append('parent_id', parentId);
  formData.append('content', content);
  if (file) formData.append('media', file);

  const res = await fetch(`${api}/add-comment`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token },
    body: formData
  });

  if (res.ok) {
    const data = await res.json();

    // ✅ 입력창, 파일, 미리보기 초기화
    if (document.getElementById(inputId)) document.getElementById(inputId).value = '';
    if (fileInput) fileInput.value = '';
    if (document.getElementById(previewId)) document.getElementById(previewId).innerHTML = '';

    // ✅ 댓글 수 업데이트
    document.getElementById(`comment-count-${feedId}`).innerText = data.comment_count;
    commentFeed(feedId, true);
  } else {
    alert("댓글 업로드 실패");
  }
}

async function secureFetchUserInfo(user_id) {
  const token = localStorage.getItem("token");

  const res = await fetch("https://supermax.kr/feed/user-info", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ user_id })
  });

  if (!res.ok) {
    const text = await res.text();
    if (text.includes("jwt expired") || text.includes("Invalid token")) {
      alert("로그인이 만료되었습니다. 다시 로그인해주세요.");
      localStorage.removeItem("token");
      localStorage.removeItem("user_id");
      location.href = "login.html";
      return null;
    }
    throw new Error("서버 응답 오류: " + text);
  }

  return await res.json();
}



// document.addEventListener("change", (e) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     let previewDiv;

//     if (e.target.id.startsWith("comment-file-")) {
//         const feedId = e.target.id.replace("comment-file-", "");
//         previewDiv = document.getElementById(`preview-${feedId}`);
//     } else if (e.target.id.startsWith("reply-media-")) {
//         const commentId = e.target.id.replace("reply-media-", "");
//         previewDiv = document.getElementById(`reply-preview-${commentId}`);
//     }

//     if (previewDiv) {
//         previewDiv.innerHTML = "";
//         const url = URL.createObjectURL(file);
//         previewDiv.innerHTML = file.type.startsWith("video")
//             ? `<video src="${url}" controls style="max-width: 300px;"></video>`
//             : `<img src="${url}" style="max-width: 300px;">`;
//     }
// });







  // ✅ 대댓글 추가
async function replyTo(commentId, feedId) {
    const replyContent = prompt("답글을 입력하세요:");
    if (!replyContent) return;

    const token = localStorage.getItem('token');
    if (!token) {
        alert("로그인이 필요합니다.");
        return;
    }

    await fetch(`${api}/add-comment`, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ feed_id: feedId, content: replyContent, parent_id: commentId })
    });

    commentFeed(feedId, true);
}

async function setupVideoObservers() {
  const videos = document.querySelectorAll('.feed-video');

  if (window.videoObserver) window.videoObserver.disconnect();

  window.videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const video = entry.target;

      if (entry.isIntersecting) {
        video.play().catch(err => {
          if (err.name !== 'AbortError') {
            console.error('⚠️ 비디오 재생 중 에러:', err);
          }
        });
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.5 });

  videos.forEach(video => window.videoObserver.observe(video));
}
function resetFeedState(endpoint) {
  currentFeedEndpoint = endpoint;
  page = 1;
  done = false;
  loading = false;
  loadedFeedIds.clear();  // ✅ 반드시 초기화해야 중복 로딩 안 생김
  document.getElementById('feeds').innerHTML = '';
}



function linkifyHashtags(text) {
  return text.replace(/#(\S+)/g, (match, tag) => {
    return `<span class="hashtag" onclick="location.href='tag-feed.html?tag=${encodeURIComponent(tag)}'">${match}</span>`;
  });
}
function extractHashtags(text) {
  const matches = text.match(/#(\S+)/g) || [];
  return matches.map(tag => tag.replace('#', '')).filter((v, i, a) => a.indexOf(v) === i);
}

async function loadUserMedals(feedUserId, feedId) {
  try {
    const res = await fetch(`${api}/user-achievements/${feedUserId}`);
    if (!res.ok) return;

    const medals = await res.json();
    const medalCount = medals.length;

    let medalIcon = '';
    if (medalCount >= 20) {
      medalIcon = '👑';
    } else if (medalCount >= 10) {
      medalIcon = '🏆';
    } else if (medalCount >= 5) {
      medalIcon = '🥇';
    } else if (medalCount > 0) {
      medalIcon = '🏅'.repeat(medalCount); // 1~4개는 반복
    }

    const nameEl = document.getElementById(`medal-${feedId}`);
    if (nameEl && medalIcon) {
      nameEl.innerHTML = `<span style="font-size: 1rem; margin-left: 6px;">${medalIcon}</span>`;
    }
  } catch (e) {
    console.error("🏅 메달 불러오기 실패", e);
  }
}







// ✅ 피드 로딩 완료 시 Observer 초기화
// ✅ 피드 로딩 완료 시 Observer 초기화
// ✅ 완성된 loadFeeds 함수 (전체 피드 / 내 피드 / 유저 피드 모두 동작)
// ✅ 완성된 loadFeeds 함수 (전체 피드 / 내 피드 / 유저 피드 모두 동작)
async function loadFeeds(endpoint, pageArg = null) {
    const feedsDiv = document.getElementById('feeds');
    const titleEl = document.getElementById('feeds-title');
  
    if (loading || done) return;
    loading = true;
  
    const isNewEndpoint = currentFeedEndpoint !== endpoint;
    const pageToUse = pageArg !== null ? pageArg : page;
  
    if (isNewEndpoint) {
      currentFeedEndpoint = endpoint;
      page = 1;
      done = false;
      feedsDiv.innerHTML = '';
      loadedFeedIds.clear();
    }
  
    const headers = {};
    if (endpoint === '/my-feeds') {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        loading = false;
        return;
      }
      headers['Authorization'] = 'Bearer ' + token;
      titleEl.innerText = '👤 My Stack';
    } else if (endpoint === '/feeds') {
      titleEl.innerText = '';
    } else if (endpoint.startsWith('/user-feeds')) {
      titleEl.innerText = `👤 ${currentUserName}님의 Stack`;
    }
  
    try {
      const res = await fetch(`${api}${endpoint}?page=${pageToUse}&limit=${limit}`, { headers });
      if (!res.ok) {
        alert('서버 오류: ' + res.status);
        loading = false;
        return;
      }
  
      const feeds = await res.json();
      if (feeds.length < limit) done = true;
  
      feeds.forEach(feed => {
        if (loadedFeedIds.has(feed.id)) return;
        loadedFeedIds.add(feed.id);
  
        let mediaHTML = '';
        const profileImage = feed.profile_image || 'https://placehold.co/40x40';
        const userName = feed.name || '사용자';
  
        if (endpoint === '/my-feeds') {
          let mediaThumb = '';
          try {
            const mediaArray = JSON.parse(feed.media_url || '[]');
            if (Array.isArray(mediaArray) && mediaArray.length > 0) {
              const url = mediaArray[0];
              mediaThumb = url.includes('.mp4')
                ? `<video src="${url}" muted playsinline preload="metadata"></video>`
                : `<img src="${url}" alt="썸네일">`;
            }
          } catch (e) {
            mediaThumb = '';
          }
  
          feedsDiv.innerHTML += `<div class="thumbnail" onclick="location.href='feed-detail.html?feedId=${feed.id}'">${mediaThumb}</div>`;
          return;
        }
  
        try {
          const mediaArray = JSON.parse(feed.media_url || '[]');
          if (Array.isArray(mediaArray) && mediaArray.length > 0) {
            const slides = mediaArray.map(url => `
              <div class="swiper-slide">
                ${url.includes('.mp4')
                  ? `<video class="feed-video" controls muted preload="none" loading="lazy" src="${url}"></video>`
                  : `<img src="${url}" loading="lazy">`}
              </div>`).join('');
  
            const swiperId = `swiper-${feed.id}`;
            mediaHTML = `
              <div class="swiper" id="${swiperId}">
                <div class="swiper-wrapper">${slides}</div>
                <div class="swiper-pagination"></div>
                <div class="swiper-button-prev"></div>
                <div class="swiper-button-next"></div>
              </div>`;
  
            setTimeout(() => {
              new Swiper(`#${swiperId}`, {
                loop: true,
                pagination: { el: `#${swiperId} .swiper-pagination` },
                navigation: {
                  nextEl: `#${swiperId} .swiper-button-next`,
                  prevEl: `#${swiperId} .swiper-button-prev`
                }
              });
            }, 0);
          }
        } catch (e) {
          mediaHTML = '';
        }

  
        const likedClass = feed.liked ? 'liked' : '';
        const likeCount = feed.like_count || 0;
        const commentCount = feed.comment_count || 0;
        const isMyFeed = localStorage.getItem('user_id') == feed.user_id;
        const timeAgo = getRelativeTime(feed.created_at);
        const contentTags = extractHashtags(feed.content || '');
        const eventTag = feed.event ? [feed.event] : [];
        const allTags = [...new Set([...eventTag, ...contentTags])];
        const tagsHtml = allTags.map(tag => `
          <span class="hashtag" onclick="location.href='tag-feed.html?tag=${encodeURIComponent(tag)}'">#${tag}</span>
        `).join(' ');
  
        feedsDiv.innerHTML += `
        <div class="feed">
          <div class="profile clickable-user" onclick="location.href='profile-feed.html?userId=${feed.user_id}'">
            <img src="${profileImage}">
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
              <strong>${userName}<span id="medal-${feed.id}"></span></strong>
              <span class="timestamp" style="font-size: 0.85rem; color: #888;">${timeAgo}</span>
            </div>
          </div>
          
      
        <!-- ✅ 여기에 종목 & 기록 표시 -->
       <div style="margin: 6px 0; font-size: 0.92rem; color: #222; display: flex; align-items: center; gap: 6px;">
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
       viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
       class="lucide lucide-dumbbell-icon lucide-dumbbell"
       style="flex-shrink: 0;">
    <path d="M14.4 14.4 9.6 9.6"/>
    <path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"/>
    <path d="m21.5 21.5-1.4-1.4"/>
    <path d="M3.9 3.9 2.5 2.5"/>
    <path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"/>
  </svg>
          <strong> ${feed.event || '종목 없음'}</strong>
          ${feed.record ? ` - ${feed.record}` : ''}
        </div>
      
       <p>${linkifyHashtags(feed.content || '')}</p>

        ${mediaHTML}
        <!-- ✅ 태그 모음 보여주기 -->
    <div class="feed-tags">${tagsHtml}</div>
    

    <div class="actions">
      <button class="like-btn ${likedClass}" id="like-btn-${feed.id}" onclick="likeFeed(${feed.id})">❤️ ${likeCount}</button>
      
      <button id="comment-btn-${feed.id}" onclick="commentFeed(${feed.id})" class="icon-btn">
        <span>💬</span> <span id="comment-count-${feed.id}">${commentCount}</span>
      </button>
      ${isMyFeed ? `<button class="edit-btn" onclick="location.href='feed-edit.html?feedId=${feed.id}'">✏️</button>` : ''}

      ${isMyFeed ? `<button class="icon-btn" onclick="deleteFeed(${feed.id})">🗑️</button>` : ''}
    </div>

    <div id="comments-${feed.id}" class="comments"></div>
  </div>`;
  loadUserMedals(feed.user_id, feed.id);

});

        

  
      await setupVideoObservers();
      page++;
    } catch (error) {
      console.error('피드 로딩 중 오류:', error);
    } finally {
      loading = false;
    }
  }
async function init() {
    console.log(`초기 페이지: ${page}`); // 정상적으로 초기값 출력
    await loadFeeds('/feeds'); // 피드 로드
}
document.addEventListener('DOMContentLoaded', () => {
    init(); // init 함수 호출
});

// 스크롤 이벤트 리스너 추가
function setupInfiniteScroll() {
  window.addEventListener('scroll', () => {
    // 스크롤이 페이지 하단에 도달했는지 확인
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
      // 현재 엔드포인트에 따라 다음 페이지 로드
      if (currentFeedEndpoint) {
        loadFeeds(currentFeedEndpoint);
      }
    }
  });
}

// 페이지 로드 시 무한 스크롤 설정
document.addEventListener('DOMContentLoaded', () => {
  setupInfiniteScroll();
  // 초기 피드 로드 (예: 전체 피드)
  loadFeeds('/feeds');
});

// ------------------------
// ✅ 댓글 기능 전역 함수
// ------------------------

window.renderComments = async function(feedId) {
  const res = await fetch(`${api}/comments/${feedId}`);
  const comments = await res.json();
  const container = document.getElementById(`comments-${feedId}`);
  if (!Array.isArray(comments)) return;

  const tree = buildCommentTree(comments);
  let finalHTML = tree.map(comment => renderCommentBlock(comment, 0)).join('');

  // ✅ 감성 댓글 입력창 유지 위해, 이쪽은 생성 안 함
  const isFeedDetail = window.location.pathname.includes('feed-detail.html');
  const inputAlreadyExists = document.getElementById('comment-input');

  if (!isFeedDetail && !inputAlreadyExists) {
    finalHTML += `
      <div class="reply-input">
        <input id="comment-input" type="text" placeholder="댓글을 입력하세요">
        <button onclick="submitComment(${feedId})">등록</button>
      </div>
    `;
  }

  container.innerHTML = finalHTML;
};





window.likeComment = async function(commentId) {
  console.log("🚀 likeComment 실행됨!", commentId);

  const token = localStorage.getItem('token');
  if (!token) return alert('로그인이 필요합니다.');

  const res = await fetch(`${api}/like-comment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ comment_id: commentId })
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("❌ 서버 오류:", errText);
    alert("댓글 좋아요 실패");
    return;
  }

  const result = await res.json();
  console.log("💬 like-comment 응답:", result);

  // ✅ 버튼 & 숫자 UI 업데이트
  const btn = document.querySelector(`#comment-like-${commentId}`);
  if (btn) {
    btn.classList.toggle('liked', result.liked);

    const span = btn.querySelector('span');
    if (span) {
      span.textContent = result.like_count;
    } else {
      btn.innerHTML = `❤️ <span>${result.like_count}</span>`;
    }
  } else {
    console.warn("❌ 버튼 못 찾음:", `#comment-like-${commentId}`);
  }
};



window.replyComment = function(parentId, feedId) {
  const parentEl = document.getElementById(`reply-box-${parentId}`);
  const content = parentEl.value.trim();
  if (!content) return alert('내용을 입력하세요');

  const token = localStorage.getItem('token');
  if (!token) return alert('로그인이 필요합니다.');

  fetch(`${api}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ feed_id: feedId, content, parent_id: parentId })
  })
    .then(res => res.json())
    .then(result => {
      if (result.success) {
        renderComments(feedId);
      } else {
        alert(result.error || '댓글 등록 실패');
      }
    });
};

window.submitComment = async function(feedId) {
  const input = document.getElementById('comment-input');
  const content = input.value.trim();
  if (!content) return alert('댓글을 입력하세요');

  const token = localStorage.getItem('token');
  if (!token) return alert('로그인이 필요합니다.');

  const res = await fetch(`${api}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ feed_id: feedId, content })
  });

  const result = await res.json();
  if (res.ok && result.success) {
    input.value = '';
    await renderComments(feedId);
  } else {
    alert(result.error || '댓글 등록 실패');
  }
};

function buildCommentTree(comments) {
  const map = {};
  const tree = [];
  comments.forEach(c => map[c.id] = { ...c, children: [] });
  comments.forEach(c => {
    if (c.parent_id && map[c.parent_id]) {
      map[c.parent_id].children.push(map[c.id]);
    } else {
      tree.push(map[c.id]);
    }
  });
  return tree;
}

function renderCommentBlock(comment, depth) {
  const indent = depth * 16;
  return `
    <div class="comment-wrapper" style="margin-left: ${indent}px">
      <div class="comment-box">
        <img src="${comment.profile_image || 'https://placehold.co/24x24'}" alt="프로필" style="width: 24px; height: 24px; border-radius: 50%; margin-right: 8px;">
        <div>
          <strong>${comment.name}</strong>
          <p style="margin-top: 4px; white-space: pre-line;">${comment.content}</p>
          <div class="comment-actions">
            <button onclick="likeComment(${comment.id})" id="comment-like-${comment.id}" class="${comment.liked ? 'liked' : ''}">❤️ <span>${comment.like_count || 0}</span></button>
            <button onclick="toggleReplyInput(${comment.id})">↩️ 답글</button>
          </div>
          <div class="reply-box" style="margin-top: 6px; display: none;" id="reply-container-${comment.id}">
            <input id="reply-box-${comment.id}" placeholder="답글을 입력하세요">
            <button onclick="replyComment(${comment.id}, ${comment.feed_id})">등록</button>
          </div>
        </div>
      </div>
      ${comment.children.map(child => renderCommentBlock(child, depth + 1)).join('')}
    </div>
  `;
}









const emojiPickers = {}; // 피드별 인스턴스 저장

window.setupEmojiPicker = function (inputId, buttonElement) {
  const input = document.getElementById(inputId);
  if (!input || !buttonElement) return;

  // 이미 열린 picker가 있으면 닫아버림 (toggle)
  if (emojiPickers[inputId] && emojiPickers[inputId].isOpen) {
    emojiPickers[inputId].picker.hidePicker();
    emojiPickers[inputId].isOpen = false;
    return;
  }

  // picker 새로 생성
  const picker = new EmojiButton({
    position: 'top-start',
    zIndex: 9999
  });

  picker.on('emoji', emoji => {
    input.value += emoji;
    input.focus();
    picker.hidePicker();                 // ✅ 선택 후 닫기
    emojiPickers[inputId].isOpen = false;
  });

  picker.on('hidden', () => {
    emojiPickers[inputId].isOpen = false;
  });

  picker.togglePicker(buttonElement);

  emojiPickers[inputId] = {
    picker,
    isOpen: true
  };
};


document.body.addEventListener("change", (e) => {

  console.log("🧪 change 이벤트 발생!", e.target.id);
  const file = e.target.files?.[0];
  if (!file) return;

  let previewDiv = null;

  if (e.target.id.startsWith("comment-file-")) {
    const feedId = e.target.id.replace("comment-file-", "");
    previewDiv = document.getElementById(`preview-${feedId}`);
  } else if (e.target.id.startsWith("reply-media-")) {
    const commentId = e.target.id.replace("reply-media-", "");
    previewDiv = document.getElementById(`reply-preview-${commentId}`);
  }

  if (previewDiv) {
    previewDiv.innerHTML = ""; // 초기화
    const url = URL.createObjectURL(file);
  
    const mediaHTML = file.type.startsWith("video")
      ? `<video src="${url}" controls style="max-width: 300px; border-radius: 8px;"></video>`
      : `<img src="${url}" style="max-width: 300px; border-radius: 8px;">`;
  
    previewDiv.innerHTML = `
      <div class="preview-container" style="position: relative; display: inline-block;">
        ${mediaHTML}
        <button class="cancel-preview" onclick="cancelPreview('${previewDiv.id}', '${e.target.id}')"
          style="position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.5); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer;">
          ✖
        </button>
      </div>
    `;
  } else {
    console.warn("😢 previewDiv 못 찾음:", e.target.id);
  }
});


function cancelPreview(previewId, inputId) {
  const preview = document.getElementById(previewId);
  const input = document.getElementById(inputId);
  if (preview) preview.innerHTML = '';
  if (input) input.value = '';
}

function setupFilePreviewListener() {
  document.querySelectorAll("input[type='file']").forEach(input => {
    input.addEventListener("change", (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const id = e.target.id;
      console.log("🧪 file input changed:", id);

      let previewDiv = null;

      if (id.startsWith("comment-file-")) {
        const feedId = id.replace("comment-file-", "");
        previewDiv = document.getElementById(`preview-${feedId}`);
      } else if (id.startsWith("reply-media-")) {
        const commentId = id.replace("reply-media-", "");
        previewDiv = document.getElementById(`reply-preview-${commentId}`);
      }

      if (previewDiv) {
        previewDiv.innerHTML = "";
        const url = URL.createObjectURL(file);
        const mediaHTML = file.type.startsWith("video")
          ? `<video src="${url}" controls style="max-width: 300px; border-radius: 8px;"></video>`
          : `<img src="${url}" style="max-width: 300px; border-radius: 8px;">`;

        previewDiv.innerHTML = `
          <div class="preview-container" style="position: relative; display: inline-block;">
            ${mediaHTML}
            <button class="cancel-preview" onclick="cancelPreview('${previewDiv.id}', '${id}')"
              style="position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.5); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer;">
              ✖
            </button>
          </div>
        `;
      } else {
        console.warn("❌ previewDiv를 찾을 수 없음:", id);
      }
    });
  });
}









window.addEventListener("DOMContentLoaded", () => {
  checkUser();
  // loadFeeds('/feeds');
});
