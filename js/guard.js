fetch('../login_php/check_session.php')
  .then((r) => r.json())
  .then((data) => {
    if (!data.authenticated) {
      window.location.replace('../index.html');
    }
  })
  .catch(() => window.location.replace('../index.html'));
