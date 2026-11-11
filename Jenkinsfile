pipeline {

    agent any

    stages {

        stage('Build') {

            steps {

                echo 'Building Registration Application'

                bat 'dir'

            }

        }

        stage('Test') {

            steps {

                echo 'Testing Registration Application'

                bat 'if exist index.html (echo Application Found) else (exit 1)'

            }

        }

        stage('Deploy') {

            steps {

                echo 'Application is ready for deployment'

            }

        }

    }

}