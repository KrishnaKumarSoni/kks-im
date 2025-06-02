// Board Posts Management System
// Use global Firebase from CDN instead of ES modules

class BoardPostsManager {
  constructor() {
    this.postsContainer = document.getElementById('postsContainer');
    this.loadingElement = document.getElementById('postsLoading');
    this.sortSelect = document.getElementById('sortSelect');
    this.posts = [];
    this.currentSort = 'newest';
    
    // Get Firebase from global scope
    this.db = window.firebaseDb;
    
    this.init();
  }

  async init() {
    this.setupEventListeners();
    this.setupRouting();
    await this.loadPosts();
    this.handleInitialRoute();
  }

  setupEventListeners() {
    // Sort functionality
    if (this.sortSelect) {
      this.sortSelect.addEventListener('change', (e) => {
        this.currentSort = e.target.value;
        this.sortAndDisplayPosts();
      });
    }

    // Handle browser back/forward navigation
    window.addEventListener('popstate', (e) => {
      this.handleRouteChange();
    });
  }

  setupRouting() {
    // Handle initial URL routing
    this.handleRouteChange();
  }

  handleInitialRoute() {
    // Check if URL contains a post ID on page load
    const path = window.location.pathname;
    const postMatch = path.match(/\/board\/post\/(.+)$/);
    
    if (postMatch) {
      const postId = postMatch[1];
      // Wait a bit for posts to load, then open modal
      setTimeout(() => {
        this.openPostModal(postId);
      }, 500);
    }
  }

  handleRouteChange() {
    const path = window.location.pathname;
    const postMatch = path.match(/\/board\/post\/(.+)$/);
    
    if (postMatch) {
      const postId = postMatch[1];
      this.openPostModal(postId);
    } else {
      // Close any open modals
      this.closeAllModals();
    }
  }

  closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      modal.classList.remove('show');
      setTimeout(() => {
        modal.remove();
      }, 300);
    });
  }

  async loadPosts() {
    try {
      this.showLoading(true);
      
      // Setup real-time listener using compat API
      const postsQuery = this.db.collection('posts').orderBy('createdAt', 'desc');
      
      postsQuery.onSnapshot((snapshot) => {
        this.posts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        this.sortAndDisplayPosts();
        this.showLoading(false);
      });
      
    } catch (error) {
      console.error('Error loading posts:', error);
      this.showError('Failed to load posts');
    }
  }

  sortAndDisplayPosts() {
    let sortedPosts = [...this.posts];
    
    switch (this.currentSort) {
      case 'oldest':
        sortedPosts.sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
        break;
      case 'upvotes':
        sortedPosts.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
        break;
      case 'comments':
        sortedPosts.sort((a, b) => (b.commentCount || 0) - (a.commentCount || 0));
        break;
      default: // newest
        sortedPosts.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
    }
    
    this.displayPosts(sortedPosts);
    this.updatePostsCount(this.posts.length);
  }

  displayPosts(posts) {
    if (!this.postsContainer) return;
    
    if (posts.length === 0) {
      this.postsContainer.innerHTML = `
        <div class="no-posts-message">
          <div class="no-posts-icon">🛠️</div>
          <h3>No Engineering Insights Yet</h3>
          <p>The board is ready for technical discussions and problem-solving insights.</p>
        </div>
      `;
      return;
    }

    this.postsContainer.innerHTML = posts.map(post => this.createPostCard(post)).join('');
    this.attachPostEventListeners();
  }

  createPostCard(post) {
    const tags = post.tags ? post.tags.map(tag => `<span class="post-tag">${tag}</span>`).join('') : '';
    const { content: truncatedContent, needsReadMore } = this.formatPostContentTruncated(post.content, post.id);
    
    return `
      <article class="post-card" data-post-id="${post.id}">        
        ${post.title ? `<h2 class="post-title">${post.title}</h2>` : ''}
        
        <div class="post-content">
          ${truncatedContent}
        </div>
        
        ${needsReadMore ? `
          <div class="read-more-container">
            <a href="/board/post/${post.id}" class="read-more-btn" data-post-id="${post.id}">
              Read More
              <span class="material-icons">arrow_forward</span>
            </a>
          </div>
        ` : ''}
        
        ${tags ? `<div class="post-tags">${tags}</div>` : ''}
        
        <div class="post-actions">
          <button class="action-btn upvote-btn ${this.hasUserUpvoted(post.id) ? 'active' : ''}" 
                  data-post-id="${post.id}">
            <span class="material-icons">keyboard_arrow_up</span>
            <span class="upvote-count">${post.upvotes || 0}</span>
          </button>
          
          <button class="action-btn comment-btn" data-post-id="${post.id}">
            <span class="material-icons">comment</span>
            <span class="comment-count">${post.commentCount || 0}</span>
          </button>
          
          <button class="action-btn share-btn" data-post-id="${post.id}">
            <span class="material-icons">share</span>
          </button>
        </div>
        
        <div class="comments-section" id="comments-${post.id}" style="display: none;">
          <div class="comments-loading">Loading comments...</div>
        </div>
      </article>
    `;
  }

  formatPostContent(content) {
    // Basic formatting for line breaks and code blocks
    const formatted = content
      .replace(/\n/g, '<br>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/```([^```]+)```/g, '<pre><code>$1</code></pre>');
    
    return formatted;
  }

  formatPostContentTruncated(content, postId) {
    const formatted = this.formatPostContent(content);
    const maxLength = 350;
    
    // Strip HTML for length calculation
    const textOnly = formatted.replace(/<[^>]*>/g, '');
    
    if (textOnly.length <= maxLength) {
      return { content: formatted, needsReadMore: false };
    }
    
    // Find a good break point (end of sentence or word)
    let truncatePoint = maxLength;
    const lastPeriod = textOnly.lastIndexOf('.', maxLength);
    const lastSpace = textOnly.lastIndexOf(' ', maxLength);
    
    if (lastPeriod > maxLength * 0.7) {
      truncatePoint = lastPeriod + 1;
    } else if (lastSpace > maxLength * 0.8) {
      truncatePoint = lastSpace;
    }
    
    const truncatedText = textOnly.substring(0, truncatePoint);
    
    return { 
      content: `${truncatedText}...`, 
      needsReadMore: true 
    };
  }

  createPostModal(post) {
    const timeAgo = this.formatTimeAgo(post.createdAt);
    const tags = post.tags ? post.tags.map(tag => `<span class="post-tag">${tag}</span>`).join('') : '';
    
    return `
      <div class="modal" id="post-modal-${post.id}">
        <div class="modal-content">
          <div class="modal-header">
            <div class="modal-header-content">
              <div class="post-meta">
                <span class="post-author">Krishna Kumar Soni</span>
                <span class="post-time">${timeAgo}</span>
              </div>
              <button class="close-btn" data-post-id="${post.id}">
                <span class="material-icons">close</span>
              </button>
            </div>
          </div>
          
          <div class="modal-body">
            <div class="modal-content-scroll">
              ${post.title ? `<h2 class="post-title">${post.title}</h2>` : ''}
              
              <div class="post-content">
                ${this.formatPostContent(post.content)}
              </div>
              
              ${tags ? `<div class="post-tags">${tags}</div>` : ''}
            </div>
            
            <div class="comments-section" id="comments-modal-${post.id}" style="display: none;">
              <div class="comments-loading">Loading comments...</div>
            </div>
          </div>
          
          <div class="modal-footer">
            <div class="post-actions">
              <button class="action-btn upvote-btn ${this.hasUserUpvoted(post.id) ? 'active' : ''}" 
                      data-post-id="${post.id}">
                <span class="material-icons">keyboard_arrow_up</span>
                <span class="upvote-count">${post.upvotes || 0}</span>
              </button>
              
              <button class="action-btn comment-btn" data-post-id="${post.id}">
                <span class="material-icons">comment</span>
                <span class="comment-count">${post.commentCount || 0}</span>
              </button>
              
              <button class="action-btn share-btn" data-post-id="${post.id}">
                <span class="material-icons">share</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  openPostModal(postId) {
    const post = this.posts.find(p => p.id === postId);
    if (!post) return;
    
    // Update URL without triggering navigation
    const newUrl = `/board/post/${postId}`;
    if (window.location.pathname !== newUrl) {
      window.history.pushState({ postId }, '', newUrl);
    }
    
    // Remove existing modal if any
    const existingModal = document.getElementById(`post-modal-${postId}`);
    if (existingModal) {
      existingModal.remove();
    }
    
    // Create and append modal
    const modalHTML = this.createPostModal(post);
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const modal = document.getElementById(`post-modal-${postId}`);
    
    // Show modal with animation
    requestAnimationFrame(() => {
      modal.classList.add('show');
    });
    
    // Attach event listeners for modal
    this.attachModalEventListeners(postId);
  }

  closePostModal(postId) {
    const modal = document.getElementById(`post-modal-${postId}`);
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => {
        modal.remove();
      }, 300);
    }
    
    // Update URL back to board
    if (window.location.pathname.includes('/board/post/')) {
      window.history.pushState({}, '', '/board');
    }
  }

  attachModalEventListeners(postId) {
    const modal = document.getElementById(`post-modal-${postId}`);
    if (!modal) return;
    
    // Close button
    const closeBtn = modal.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
      this.closePostModal(postId);
    });
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closePostModal(postId);
      }
    });
    
    // Escape key to close
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        this.closePostModal(postId);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Attach post action listeners within modal
    this.attachPostActionsToModal(modal, postId);
  }

  attachPostActionsToModal(modal, postId) {
    // Upvote button in modal
    const upvoteBtn = modal.querySelector('.upvote-btn');
    upvoteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleUpvote(postId);
    });

    // Comment button in modal
    const commentBtn = modal.querySelector('.comment-btn');
    commentBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleComments(postId);
    });

    // Share button in modal
    const shareBtn = modal.querySelector('.share-btn');
    shareBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.sharePost(postId);
    });
  }

  formatTimeAgo(timestamp) {
    if (!timestamp) return 'Unknown time';
    
    const now = new Date();
    const postTime = timestamp.toDate();
    const diffMs = now - postTime;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return postTime.toLocaleDateString();
  }

  attachPostEventListeners() {
    // Upvote buttons
    document.querySelectorAll('.upvote-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const postId = btn.dataset.postId;
        this.toggleUpvote(postId);
      });
    });

    // Comment buttons
    document.querySelectorAll('.comment-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const postId = btn.dataset.postId;
        this.toggleComments(postId);
      });
    });

    // Share buttons
    document.querySelectorAll('.share-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const postId = btn.dataset.postId;
        this.sharePost(postId);
      });
    });

    // Read more buttons - handle as navigation
    document.querySelectorAll('.read-more-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const postId = btn.dataset.postId;
        const newUrl = `/board/post/${postId}`;
        window.history.pushState({ postId }, '', newUrl);
        this.openPostModal(postId);
      });
    });
  }

  async toggleUpvote(postId) {
    try {
      const hasUpvoted = this.hasUserUpvoted(postId);
      const postRef = this.db.collection('posts').doc(postId);
      
      if (hasUpvoted) {
        // Remove upvote
        await postRef.update({
          upvotes: firebase.firestore.FieldValue.increment(-1)
        });
        this.removeUserUpvote(postId);
      } else {
        // Add upvote
        await postRef.update({
          upvotes: firebase.firestore.FieldValue.increment(1)
        });
        this.addUserUpvote(postId);
      }
      
      // Update UI optimistically
      this.updateUpvoteUI(postId, !hasUpvoted);
      
    } catch (error) {
      console.error('Error toggling upvote:', error);
    }
  }

  hasUserUpvoted(postId) {
    const upvoted = JSON.parse(localStorage.getItem('upvotedPosts') || '[]');
    return upvoted.includes(postId);
  }

  addUserUpvote(postId) {
    const upvoted = JSON.parse(localStorage.getItem('upvotedPosts') || '[]');
    upvoted.push(postId);
    localStorage.setItem('upvotedPosts', JSON.stringify(upvoted));
  }

  removeUserUpvote(postId) {
    const upvoted = JSON.parse(localStorage.getItem('upvotedPosts') || '[]');
    const filtered = upvoted.filter(id => id !== postId);
    localStorage.setItem('upvotedPosts', JSON.stringify(filtered));
  }

  updateUpvoteUI(postId, isUpvoted) {
    // Update both regular post card and modal upvote buttons
    const regularBtn = document.querySelector(`.post-card[data-post-id="${postId}"] .upvote-btn`);
    const modalBtn = document.querySelector(`#post-modal-${postId} .upvote-btn`);
    
    if (regularBtn) {
      regularBtn.classList.toggle('active', isUpvoted);
    }
    if (modalBtn) {
      modalBtn.classList.toggle('active', isUpvoted);
    }
  }

  toggleComments(postId) {
    // Check if we're in a modal context
    const modalCommentsSection = document.getElementById(`comments-modal-${postId}`);
    const regularCommentsSection = document.getElementById(`comments-${postId}`);
    
    if (modalCommentsSection) {
      // Modal context - slide in from bottom
      if (!modalCommentsSection.classList.contains('show')) {
        modalCommentsSection.classList.add('show');
        this.loadComments(postId, true); // true for modal context
      } else {
        modalCommentsSection.classList.remove('show');
      }
    } else if (regularCommentsSection) {
      // Regular context
      if (regularCommentsSection.style.display === 'none') {
        regularCommentsSection.style.display = 'block';
        this.loadComments(postId, false); // false for regular context
      } else {
        regularCommentsSection.style.display = 'none';
      }
    }
  }

  async loadComments(postId, isModal = false) {
    const commentsSection = document.getElementById(isModal ? `comments-modal-${postId}` : `comments-${postId}`);
    
    try {
      const commentsQuery = this.db.collection('comments').orderBy('createdAt', 'asc');
      
      const snapshot = await commentsQuery.get();
      const comments = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(comment => comment.postId === postId);
      
      this.displayComments(postId, comments, isModal);
      
    } catch (error) {
      console.error('Error loading comments:', error);
      commentsSection.innerHTML = '<div class="error-message">Failed to load comments</div>';
    }
  }

  displayComments(postId, comments, isModal = false) {
    const commentsSection = document.getElementById(isModal ? `comments-modal-${postId}` : `comments-${postId}`);
    const suffix = isModal ? '-modal' : '';
    
    const commentForm = `
      <div class="comment-form">
        <textarea placeholder="Share your thoughts..." id="comment-input-${postId}${suffix}"></textarea>
        <div class="comment-form-meta">
          <input type="text" placeholder="Your name (optional)" id="comment-name-${postId}${suffix}">
          <button class="submit-comment-btn" onclick="boardPosts.submitComment('${postId}', ${isModal})">
            Post Comment
          </button>
        </div>
      </div>
    `;
    
    const commentsHtml = comments.map(comment => `
      <div class="comment">
        <div class="comment-header">
          <span class="comment-author">${comment.authorName || 'Anonymous'}</span>
          <span class="comment-time">${this.formatTimeAgo(comment.createdAt)}</span>
        </div>
        <div class="comment-content">${comment.content.replace(/\n/g, '<br>')}</div>
      </div>
    `).join('');
    
    commentsSection.innerHTML = commentForm + '<div class="comments-list">' + commentsHtml + '</div>';
  }

  async submitComment(postId, isModal = false) {
    const suffix = isModal ? '-modal' : '';
    const contentInput = document.getElementById(`comment-input-${postId}${suffix}`);
    const nameInput = document.getElementById(`comment-name-${postId}${suffix}`);
    
    const content = contentInput.value.trim();
    if (!content) return;
    
    try {
      // Add comment to Firestore
      await this.db.collection('comments').add({
        postId: postId,
        content: content,
        authorName: nameInput.value.trim() || 'Anonymous',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        approved: true // Auto-approve for MVP
      });
      
      // Update post comment count
      const postRef = this.db.collection('posts').doc(postId);
      await postRef.update({
        commentCount: firebase.firestore.FieldValue.increment(1)
      });
      
      // Clear form and reload comments
      contentInput.value = '';
      nameInput.value = '';
      this.loadComments(postId, isModal);
      
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  }

  sharePost(postId) {
    const url = `${window.location.origin}/board#post-${postId}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Engineering Insight',
        url: url
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(url).then(() => {
        this.showNotification('Link copied to clipboard!');
      });
    }
  }

  showLoading(show) {
    if (this.loadingElement) {
      this.loadingElement.style.display = show ? 'block' : 'none';
    }
  }

  showError(message) {
    if (this.postsContainer) {
      this.postsContainer.innerHTML = `
        <div class="error-message">
          <span class="material-icons">error</span>
          <p>${message}</p>
        </div>
      `;
    }
  }

  showNotification(message) {
    // Create and show notification
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  updatePostsCount(count) {
    const countElement = document.getElementById('postsCount');
    if (countElement) {
      countElement.textContent = count.toString().padStart(2, '0');
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.boardPosts = new BoardPostsManager();
}); 