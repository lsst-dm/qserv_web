cmake_minimum_required(VERSION 3.1)
project(qserv_web)

# For now, we just have the static content.  Arrange for it to be copied over
# to the installation target directory during install phase ("make install"). 

install(
    DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}/www/
    DESTINATION ${CMAKE_INSTALL_PREFIX}/qserv/www/
)
