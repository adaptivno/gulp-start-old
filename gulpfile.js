var gulp          = require('gulp'), // Подключаем Gulp
    sass          = require('gulp-sass'), //Подключаем Sass пакет
    browserSync   = require('browser-sync').create(), // Подключаем Browser Sync
    autoprefixer  = require('gulp-autoprefixer'),// Подключаем библиотеку для автоматического добавления префиксов
    csscomb       = require('gulp-csscomb'), // Подключаем библиотеку для причесывания CSS
    gcmq          = require('gulp-group-css-media-queries'), // Подключаем библиотеку для объединение медиа запросов в css
    concat        = require('gulp-concat'), // Подключаем gulp-concat (для конкатенации файлов)
    uglify        = require('gulp-uglifyjs'), // Подключаем gulp-uglifyjs (для сжатия JS)
    imagemin      = require('gulp-imagemin'), // Подключаем библиотеку для работы с изображениями
    zip           = require('gulp-vinyl-zip'), // Подключаем библиотеку gulp-vinyl-zip для автоматической архивации
    del           = require('del'), // Подключаем библиотеку для удаления файлов и папок
    newer         = require('gulp-newer'), // Подключаем библиотеку для проверки на изменение файлов
    fileinclude   = require('gulp-file-include'), // Подключаем библиотеку gulp-file-include для работы с html инклюдами
    plumber       = require('gulp-plumber'), // Подключаем библиотеку для отслеживания ошибок в css
    notify        = require("gulp-notify"), // Подключаем библиотеку для информирования
    replace       = require('gulp-replace-path'); // Подключаем библиотеку для изменения путей в коде файлов


/**
* Таск BrowserSync
*/

gulp.task('browser-sync', function() {
    browserSync.init({
        server: {
            baseDir: "dist"
        },
        notify: false
    });
});

/**
* Работы со стилями
*/

gulp.task('sass', function(){ // Создаем таск Sass
  return gulp.src('app/scss/**/*.scss') // Берем источник
    .pipe(plumber({
        errorHandler: notify.onError(function(err) {
            return {
                title: 'Styles',
                message: err.message
            };
        })
    }))
    .pipe(sass()) // Преобразуем Scss в CSS посредством gulp-sass
    .pipe(autoprefixer({ // Создаем префиксы
        browsers: ['last 15 versions'],
        cascade: false
    }))
    .pipe(csscomb('csscomb.json')) // Причесываем CSS
    .pipe(gcmq()) // Группируем медиа запросы + удаляются косяки csscomb
    .pipe(replace('../../img/', '../img/')) // изменяем пути изображений из инклюдов на правильные для продакшена
    .pipe(gulp.dest('dist/css')) // Выгружаем результата в папку dist/css
    .pipe(browserSync.stream());
});


/**
* Работа с html
*/

gulp.task('html', function() {
  return gulp.src('app/*.*')
    .pipe(fileinclude({
        indent: 'boolean'
    }))
    .pipe(replace('../img/', 'img/')) // изменяем пути изображений из инклюдов на правильные для продакшена
    .pipe(gulp.dest('dist'))
    .pipe(browserSync.stream());
});

/**
* Работа со шрифтами
*/

gulp.task('fonts', function() {
  return gulp.src('app/fonts/**/*')
    .pipe(gulp.dest('dist/fonts'))
});

/**
* Работа со скриптами
*/

gulp.task('js', function() {
  return gulp.src('app/js/*.js')
    .pipe(gulp.dest('dist/js')) // Выгружаем в папку dist/js
    .pipe(browserSync.stream());;
});

gulp.task('js-libs', function() {
  return gulp.src('app/js/libs/**/*.js')
    .pipe(concat('libs.min.js')) // Собираем все скрипты в кучу в новом файле libs.min.js
    .pipe(uglify()) // Сжимаем JS файл
    .pipe(gulp.dest('dist/js')) // Выгружаем в папку dist/js
    .pipe(browserSync.stream());;
});

gulp.task('js-source', function() {
  return gulp.src('app/js/libs/**/*.js')
    .pipe(gulp.dest('dist/js/libs'))
    .pipe(browserSync.stream());;
});

/**
* Работа с изображениями
*/

gulp.task('img', function() {
  return gulp.src('app/img/**/*') // Берем все изображения из app
    .pipe(newer('dist/img'))
    .pipe(imagemin({  // Сжимаем их с наилучшими настройками с учетом кеширования
      interlaced: true,
      progressive: true,
      svgoPlugins: [{removeViewBox: false}]
    }))
    .pipe(gulp.dest('dist/img'))
    .pipe(browserSync.stream());
});


/**
* Удаление
*/

gulp.task('clean', function() {
  return del.sync('dist');
});

gulp.task('clean-zip', function() {
  return del.sync('html.zip'); // Удаляем html.zip перед архивацией
});


/**
* Создание zip архива
*/

gulp.task('zip', ['clean-zip', 'pr'], function () {
    return gulp.src('dist/**/**/**/*')
        .pipe(zip.dest('html.zip'));
});


/**
* Сборка
*/

gulp.task('build', ['clean', 'img', 'html', 'sass', 'fonts', 'js', 'js-libs']);


/**
* Наблюдение за изменениями
*/

gulp.task('watch', ['browser-sync'], function() {
  gulp.watch('app/scss/**/*.scss', function(event, cb) {
        setTimeout(function(){
          gulp.start('sass');
        }, 1000)
    }); // Наблюдение за scss файлами в папке sass с таймаутом
  gulp.watch('app/**/*.*', ['html']); // Наблюдение за html файлами
  gulp.watch('app/js/**/*.js', ['js', 'js-libs']); // Наблюдение за js файлами
  gulp.watch('app/img/**/*', ['img']); // Наблюдение за изображениями
});

/**
* Продакшен
*/

gulp.task('pr', ['build', 'js-source']);

/**
* Задача по умолчанию
*/

gulp.task('default', ['build','watch']);