pipeline {
    agent any
    
    environment {
        GITHUB_CREDENTIALS = credentials('github-ssh-key')
        ROUTER_CREDENTIALS = credentials('jenkins-ssh-key')
        
        // Параметры роутеров
        OPENWRT_ROUTER = '192.168.1.1'
        ENTWARE_AARCH64_ROUTER = '10.111.1.1'
        ENTWARE_MIPS_ROUTER = '192.168.1.2'
        ENTWARE_MIPSEL_ROUTER = '192.168.1.2'
        PADAVAN_ROUTER = '192.168.1.3'
        
        OPENWRT_SSH_PORT = '22'
        ENTWARE_SSH_PORT = '1221'
        PADAVAN_SSH_PORT = '22'
        ROUTER_USER = 'root'
    }
    
    parameters {
        choice(
            name: 'BUILD_TARGET',
            choices: ['all', 'openwrt', 'entware', 'padavan'],
            description: 'Выбирите целевую систему'
        )
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    credentialsId: 'github-ssh-key',
                    url: 'git@github.com:qzeleza/kvaspro.git'
            }
        }

        stage('Сборка Docker образов') {
            parallel {
                stage('OpenWRT система') {
                    when { expression { params.BUILD_TARGET in ['all', 'openwrt'] } }
                    steps {
                        script {
                            try {
                                docker.build('openwrt-builder:${BUILD_NUMBER}', '-f /docker/openwrt/Dockerfile .')
                            } catch (err) {
                                echo "Ошибка сборки OpenWRT образа: ${err}"
                                currentBuild.result = 'FAILURE'
                                throw err // Прерывает pipeline в случае ошибки
                            }
                        }
                    }
                }
                
                stage('Entware система') {
                    when { expression { params.BUILD_TARGET in ['all', 'entware'] } }
                    steps {
                        script {
                            try {
                                docker.build('entware-builder:${BUILD_NUMBER}', '-f /docker/entware/Dockerfile .')
                            } catch (err) {
                                echo "Ошибка сборки Entware образа: ${err}"
                                currentBuild.result = 'FAILURE'
                                throw err // Прерывает pipeline в случае ошибки
                            }
                        }
                    }
                }
                
                stage('Padavan система') {
                    when { expression { params.BUILD_TARGET in ['all', 'padavan'] } }
                    steps {
                        
                        script {
                            try {
                                docker.build('padavan-builder:${BUILD_NUMBER}', '-f /docker/padavan/Dockerfile .')
                            } catch (err) {
                                    echo "Ошибка сборки Padavan образа: ${err}"
                                    currentBuild.result = 'FAILURE'
                                    throw err // Прерывает pipeline в случае ошибки
                            }
                        }
                    }
                }
            }
        }

        stage('Сборка пакета') {
            parallel {
                stage('Сборка OpenWRT пакета') {
                    when { expression { params.BUILD_TARGET in ['all', 'openwrt'] } }
                    steps {
                        script {
                            def targets = [
                                [name: 'aarch64', arch: 'aarch64_cortex-a53', config: 'config-aarch64'],
                                [name: 'mips', arch: 'mips_24kc', config: 'config-mips'],
                                [name: 'mipsel', arch: 'mipsel_24kc', config: 'config-mipsel']
                            ]

                            for (target in targets) {
                                try {
                                    docker.image("openwrt-builder:${BUILD_NUMBER}").inside { // Изменен образ на openwrt-builder
                                        sh """
                                            cd /build
                                            ./scripts/feeds update -a
                                            ./scripts/feeds install -a
                                            make ${target.config}
                                            make package/kvaspro/compile V=s ARCH=${target.arch} # Предполагается, что kvaspro есть в feeds
                                            mkdir -p /tmp/artifacts/openwrt/${target.name}
                                            cp bin/targets/*/*/*.ipk /tmp/artifacts/openwrt/${target.name}/
                                        """
                                    }
                                    archiveArtifacts artifacts: "tmp/artifacts/openwrt/${target.name}/*.ipk", fingerprint: true
                                } catch (err) {
                                    echo "Ошибка сборки пакета для ${target.name}: ${err}"
                                    currentBuild.result = 'FAILURE'
                                    // continue //  Раскомментируйте, чтобы продолжить сборку других архитектур при ошибке
                                    throw err // Прерывает pipeline в случае ошибки
                                }
                            }
                        }
                    }
                }
                stage('Сборка Entware пакета') {
                    when { expression { params.BUILD_TARGET in ['all', 'entware'] } }
                    steps {
                        script {
                            def targets = [
                                [name: 'aarch64', arch: 'aarch64_cortex-a53', config: 'config-aarch64'],
                                [name: 'mips', arch: 'mips_24kc', config: 'config-mips'],
                                [name: 'mipsel', arch: 'mipsel_24kc', config: 'config-mipsel']
                            ]

                            for (target in targets) {
                                try {
                                    docker.image("entware-builder:${BUILD_NUMBER}").inside {
                                        sh """
                                            cd /build
                                            ./scripts/feeds update -a
                                            ./scripts/feeds install -a
                                            make ${target.config}
                                            make package/kvaspro/compile V=s ARCH=${target.arch}
                                            # Создаем директорию для артефактов с учетом архитектуры
                                            mkdir -p /tmp/artifacts/entware/${target.name}
                                            cp bin/packages/*/*.ipk /tmp/artifacts/entware/${target.name}/
                                        """
                                    }
                                    // Архивируем артефакты для каждой архитектуры
                                    archiveArtifacts artifacts: "tmp/artifacts/entware/${target.name}/*.ipk", fingerprint: true
                                } catch (err) {
                                    echo "Ошибка сборки пакета для ${target.name}: ${err}"
                                    currentBuild.result = 'FAILURE'
                                    //  Можно не прерывать сборку для других архитектур:
                                    // continue // Продолжить сборку для следующих архитектур
                                    throw err // Прерывает pipeline в случае ошибки
                                }
                            }
                        }
                    }
                }
                stage('Сборка Padavan пакета') {
                    when { expression { params.BUILD_TARGET in ['all', 'padavan'] } }
                    steps {
                        script {
                            def targets = [
                                [name: 'aarch64', arch: 'aarch64_cortex-a53', config: 'config-aarch64'],
                                [name: 'mips', arch: 'mips_24kc', config: 'config-mips'],
                                [name: 'mipsel', arch: 'mipsel_24kc', config: 'config-mipsel']
                            ]

                            for (target in targets) {
                                try {
                                    docker.image("padavan-builder:${BUILD_NUMBER}").inside {
                                        sh """
                                            cd /build
                                            ./scripts/feeds update -a
                                            ./scripts/feeds install -a
                                            make ${target.config}
                                            make package/kvaspro/compile V=s ARCH=${target.arch}
                                            # Создаем директорию для артефактов с учетом архитектуры
                                            mkdir -p /tmp/artifacts/padavan/${target.name}
                                            cp bin/packages/*/*.ipk /tmp/artifacts/padavan/${target.name}/
                                        """
                                    }
                                    // Архивируем артефакты для каждой архитектуры
                                    archiveArtifacts artifacts: "tmp/artifacts/padavan/${target.name}/*.ipk", fingerprint: true
                                } catch (err) {
                                    echo "Ошибка сборки пакета для ${target.name} Padavan: ${err}"
                                    currentBuild.result = 'FAILURE'
                                    //  Можно не прерывать сборку для других архитектур:
                                    // continue // Продолжить сборку для следующих архитектур
                                    throw err // Прерывает pipeline в случае ошибки
                                }
                            }
                        }
                    }
                }
                
                // Аналогично для Entware и Padavan
            }
        }
        stage('Отправка на роутеры') {
            parallel {
                stage('Отправка пакета на OpenWRT роутер') {
                    when { expression { params.BUILD_TARGET in ['all', 'openwrt'] } }
                    steps {
                        script {
                            // Копирование пакета на роутер
                            sh """
                                scp -P ${SSH_PORT} -i ${ROUTER_CREDENTIALS} \
                                    /tmp/artifacts/openwrt/*.ipk \
                                    ${ROUTER_USER}@${OPENWRT_ROUTER}:/tmp/
                                
                                # Установка пакета
                                ssh -p ${SSH_PORT} -i ${ROUTER_CREDENTIALS} \
                                    ${ROUTER_USER}@${OPENWRT_ROUTER} \
                                    'opkg install /tmp/*.ipk
                                    # Проверка работоспособности пакета
                                if ! ssh -p ${SSH_PORT} -i ${ROUTER_CREDENTIALS} \
                                    ${ROUTER_USER}@${OPENWRT_ROUTER} \
                                    'ps | grep -v grep | grep your-package'; then
                                    exit 1
                                fi
                            """
                        }
                    }
                }
                
                stage('Verify Entware') {
                    when { expression { params.BUILD_TARGET in ['all', 'entware'] } }
                    steps {
                        script {
                            sh """
                                ssh -p ${SSH_PORT} -i ${ROUTER_CREDENTIALS} \
                                    ${ROUTER_USER}@${ENTWARE_ROUTER} \
                                    '/opt/etc/init.d/S99your-package start && \
                                     sleep 10 && \
                                     /opt/etc/init.d/S99your-package status'

                                if ! ssh -p ${SSH_PORT} -i ${ROUTER_CREDENTIALS} \
                                    ${ROUTER_USER}@${ENTWARE_ROUTER} \
                                    'ps | grep -v grep | grep your-package'; then
                                    exit 1
                                fi
                            """
                        }
                    }
                }
                
                stage('Verify Padavan') {
                    when { expression { params.BUILD_TARGET in ['all', 'padavan'] } }
                    steps {
                        script {
                            sh """
                                ssh -p ${SSH_PORT} -i ${ROUTER_CREDENTIALS} \
                                    ${ROUTER_USER}@${PADAVAN_ROUTER} \
                                    '/usr/bin/your-package start && \
                                     sleep 10 && \
                                     /usr/bin/your-package status'

                                if ! ssh -p ${SSH_PORT} -i ${ROUTER_CREDENTIALS} \
                                    ${ROUTER_USER}@${PADAVAN_ROUTER} \
                                    'ps | grep -v grep | grep your-package'; then
                                    exit 1
                                fi
                            """
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            // Очистка рабочего пространства
            cleanWs()
            
            // Удаление временных Docker образов
            sh 'docker system prune -f'
        }
        
        success {
            // Отправка уведомления об успешной сборке
            emailext (
                subject: "Build Successful: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """
                    Build completed successfully!
                    
                    Job: ${env.JOB_NAME}
                    Build Number: ${env.BUILD_NUMBER}
                    Build URL: ${env.BUILD_URL}
                    
                    Test Results Summary:
                    - OpenWRT: ${currentBuild.rawBuild.getAction(hudson.tasks.junit.TestResultAction.class)?.failCount ?: 'N/A'} failures
                    
                    Package Status:
                    - OpenWRT: Running
                    - Entware: Running
                    - Padavan: Running
                """,
                to: 'your-email@domain.com'
            )
        }
        
        failure {
            // Отправка уведомления о неудачной сборке
            emailext (
                subject: "Build Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """
                    Build failed!
                    
                    Job: ${env.JOB_NAME}
                    Build Number: ${env.BUILD_NUMBER}
                    Build URL: ${env.BUILD_URL}
                    
                    Please check the build logs for more details.
                """,
                to: 'your-email@domain.com'
            )
        }
    }
}
                                    
pipeline {
    agent any

    environment {
        // Определение переменных окружения, например:
        GITHUB_REPO = 'ваш_репозиторий'
        GITHUB_CREDENTIALS = 'github-credentials' // ID сохраненных учетных данных GitHub
        SSH_CREDENTIALS = 'ssh-credentials' // ID сохраненных учетных данных SSH
        ROUTER_IP = 'IP_роутера'
        ROUTER_PORT = '22' // Порт SSH роутера
    }

    stages {
        stage('Checkout') {
            steps {
                git credentialsId: "${GITHUB_CREDENTIALS}", url: "https://github.com/${GITHUB_REPO}.git"
            }
        }

        stage('Сборка Docker образов и пакетов') {
            parallel {
                stage('OpenWRT') {
                    steps {
                        docker.image('openwrt-build-environment').inside {
                            sh './build_openwrt_package.sh'
                        }
                    }
                }
                stage('Entware') {
                    steps {
                        docker.image('entware-build-environment').inside {
                            sh './build_entware_package.sh'
                        }
                    }
                }
                stage('Padavan') {
                    steps {
                        docker.image('padavan-build-environment').inside {
                            sh './build_padavan_package.sh'
                        }
                    }
                }
            }
        }

        stage('Копирование и запуск на роутере') {
            steps {
                sshPublisher(publishers: [
                    sshPublisherDesc(configName: 'RouterConfig', transfers: [
                        sshTransfer(sourceFiles: 'openwrt/*.ipk', remoteDirectory: '/tmp'),
                        sshTransfer(sourceFiles: 'entware/*.ipk', remoteDirectory: '/tmp'),
                        sshTransfer(sourceFiles: 'padavan/*.trx', remoteDirectory: '/tmp')
                    ], execCommand: 'opkg install /tmp/*.ipk && /tmp/test_package.sh') // Пример команды для OpenWRT
                ])
            }
        }

        stage('Тестирование') {
            steps {
                // Запуск тестов на роутере через SSH
                sshPublisher(publishers: [
                    sshPublisherDesc(configName: 'RouterConfig', execCommand: 'sh /tmp/run_tests.sh')
                ])
            }
        }
    }
}