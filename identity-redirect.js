/* If someone lands here via a Netlify Identity invite/confirmation/recovery
   link (which drops a token in the URL hash), forward them straight to the
   admin panel so it can process the token and show the set-password screen. */
(function(){
  var hash = window.location.hash || '';
  var hasToken = /(invite_token|confirmation_token|recovery_token)=/.test(hash);
  var onAdmin = /admin\.html$/.test(window.location.pathname);
  if(hasToken && !onAdmin){
    var adminPath = window.location.pathname.indexOf('/posts/') > -1 ? '../admin.html' : 'admin.html';
    window.location.replace(adminPath + hash);
  }
})();
