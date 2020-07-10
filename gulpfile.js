let gulp = require('gulp'),
    sass = require('gulp-sass'),
    minify = require('gulp-minify'),
    pug = require('gulp-pug'),
    webserver = require('gulp-webserver'),
    fs = require('fs');

sass.compiler = require('node-sass');

gulp.task('sass', function () {
  return gulp.src('./src/scss/*.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./dist/css'));
});

gulp.task('js', function() {
  return gulp.src('./src/js/*.js')
    .pipe(minify())
    .pipe(gulp.dest('dist/js'));
});

gulp.task('views', function buildHTML() {
  let svg = fs.readFileSync("./assets/graphics/usMap.svg");
  return gulp.src('./views/*.pug')
    .pipe(pug({
      data: {
        svg: svg
      }
    }))
    .pipe(gulp.dest('.'));
});

gulp.task('webserver', function() {
  return gulp.src('.')
    .pipe(webserver({
      livereload: true,
      open: true,
    }));
});

gulp.task('watch', function () {
  gulp.watch('./src/scss/*.scss', gulp.series('sass'));
  gulp.watch('./src/js/*.js', gulp.series('js'));
  gulp.watch('./views/*.pug', gulp.series('views'));
});

gulp.task('default', gulp.parallel(gulp.series('sass', 'js', 'views', 'watch'), gulp.series('webserver')));
