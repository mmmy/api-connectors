
$(function(){
  $.get('/list', function(data) {
    data.forEach(item => {
      Site.renderStrategy(item)
    })
  })
})