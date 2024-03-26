const express = require("express");
const path = require("path");
const collegeData = require("./modules/collegeData.js");

const app = express();
const HTTP_PORT = process.env.PORT || 8080;

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));
var exphbs = require('express-handlebars');
app.engine('.hbs', exphbs.engine({ 
  extname: '.hbs',
  defaultLayout: 'main',
  helpers: {
      navLink: function(url, options) {
          return '<li' + ((url === app.locals.activeRoute) ? ' class="nav-item active" ' : ' class="nav-item" ') + '><a class="nav-link" href="' + url + '">' + options.fn(this) + '</a></li>';
      },
      equal: function (lvalue, rvalue, options) {if (arguments.length < 3)throw new Error("Handlebars Helper equal needs 2 parameters");if (lvalue != rvalue) {return options.inverse(this);} else {return options.fn(this);}}

  }
}));

app.set('view engine', '.hbs');

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(function(req,res,next){let route = req.path.substring(1);app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));next();});

// Initialize college data before setting up routes
collegeData.initialize()
  .then(() => {
    console.log("Data initialized. Setting up routes.");

    // Route for homepage
    app.get("/", (req, res) => {
      res.render("home");
    })

    // Route for htmlDemo
    app.get("/htmlDemo", (req, res) => {
      res.render("htmlDemo");
    })

    // Route for fetching all students or students by course
    
    app.get("/students", (req, res) => {
      const courseParam = req.query.course;

      if (courseParam) {
          collegeData.getStudentsByCourse(parseInt(courseParam))
              .then(students => {
                  res.render("students",{students: students});
              })
              .catch(() => {
                  res.render("students", {message: "no results"});
              });
      } else {
          collegeData.getAllStudents()
              .then(students => {
                  res.render("students",{students: students});
              })
              .catch(() => {
                  res.render("students", {message: "no results"});
              });
      }
  });

    // Route for fetching TAs
    app.get("/tas", (req, res) => {
      collegeData.getTAs()
        .then((tas) => res.json(tas))
        .catch(() => res.status(500).json({ message: "Failed to fetch TAs" }));
    });

    // Route for fetching courses
    app.get("/courses", (req, res) => {
      collegeData.getCourses()
          .then((courses) => res.render("courses", { courses: courses }))
          .catch(() => res.render("courses", { message: "No results" }));
  });
  

    // Route for fetching a student by number
app.get("/student/:num", (req, res) => {
  const studentNum = parseInt(req.params.num);
  collegeData.getStudentByNum(studentNum)
      .then((student) => res.render("student", { student: student }))
      .catch(() => res.render("student", { message: "No results" }));
});


    // Route for serving add student form
    app.get("/students/add", (req, res) => {
      res.render("addStudent");
    });

    // Route for submitting new student data
    app.post("/students/add", (req, res) => {
      collegeData.addStudent(req.body)
        .then(() => res.redirect("/students"))
        .catch((err) => {
          console.error(err);
          res.status(500).send("Failed to save student data");
        });
    });

    // Route for about page
    app.get("/about", (req, res) => {
      res.render("about");
    });

    // Route to handle a single course by id
    app.get("/course/:id", (req, res) => {
      const courseId = parseInt(req.params.id);
      collegeData.getCourseById(courseId)
          .then(course => {
              res.render("course", {course: course});
          })
          .catch(() => {
              res.render("course", {message: "no results"});
          });
  });

  app.post("/student/update", (req, res) => {
    collegeData.updateStudent(req.body)
        .then(() => {
            res.redirect("/students");
        })
        .catch(() => {
            res.redirect("/students");
        });
});

    // Catch-all route for handling unmatched routes
    app.use((req, res) => {
      res.status(404).send("Page Not Found");
    });

    // Start the server
    app.listen(HTTP_PORT, () => {
      console.log("Server listening on port:", HTTP_PORT);
    });

  })
  .catch(err => {
    console.error("Failed to initialize data:", err);
  });
