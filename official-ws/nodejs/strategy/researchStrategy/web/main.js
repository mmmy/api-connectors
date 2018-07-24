
$(function(){
  $.get('/list', function(data) {
    data.forEach((item, i) => {
      Site.renderStrategy(item, i)
    })
  })
})