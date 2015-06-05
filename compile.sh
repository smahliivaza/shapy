#!/bin/sh

java -jar /opt/google/closure-compiler/compiler.jar \
  --js client/js/*.js \
  --js client/js/editor/*.js \
  --js /opt/google/closure-library/closure/goog/base.js \
  --js /opt/google/closure-library/closure/goog/array/array.js \
  --js /opt/google/closure-library/closure/goog/asserts/asserts.js \
  --js /opt/google/closure-library/closure/goog/dom/browserfeature.js \
  --js /opt/google/closure-library/closure/goog/dom/dom.js \
  --js /opt/google/closure-library/closure/goog/dom/nodetype.js \
  --js /opt/google/closure-library/closure/goog/dom/safe.js \
  --js /opt/google/closure-library/closure/goog/dom/tags.js \
  --js /opt/google/closure-library/closure/goog/dom/tagname.js \
  --js /opt/google/closure-library/closure/goog/debug/error.js \
  --js /opt/google/closure-library/closure/goog/fs/url.js \
  --js /opt/google/closure-library/closure/goog/html/safehtml.js \
  --js /opt/google/closure-library/closure/goog/html/safeurl.js \
  --js /opt/google/closure-library/closure/goog/html/safestyle.js \
  --js /opt/google/closure-library/closure/goog/html/safestylesheet.js \
  --js /opt/google/closure-library/closure/goog/html/trustedresourceurl.js \
  --js /opt/google/closure-library/closure/goog/i18n/bidi.js \
  --js /opt/google/closure-library/closure/goog/math/coordinate.js \
  --js /opt/google/closure-library/closure/goog/math/size.js \
  --js /opt/google/closure-library/closure/goog/string/string.js \
  --js /opt/google/closure-library/closure/goog/string/const.js \
  --js /opt/google/closure-library/closure/goog/string/typedstring.js \
  --js /opt/google/closure-library/closure/goog/labs/useragent/browser.js \
  --js /opt/google/closure-library/closure/goog/labs/useragent/engine.js \
  --js /opt/google/closure-library/closure/goog/labs/useragent/platform.js \
  --js /opt/google/closure-library/closure/goog/labs/useragent/util.js \
  --js /opt/google/closure-library/closure/goog/math/math.js \
  --js /opt/google/closure-library/closure/goog/object/object.js \
  --js /opt/google/closure-library/closure/goog/useragent/useragent.js \
  --js /opt/google/closure-library/closure/goog/vec/float32array.js \
  --js /opt/google/closure-library/closure/goog/vec/float64array.js \
  --js /opt/google/closure-library/closure/goog/vec/mat3.js \
  --js /opt/google/closure-library/closure/goog/vec/mat4.js \
  --js /opt/google/closure-library/closure/goog/vec/ray.js \
  --js /opt/google/closure-library/closure/goog/vec/vec.js \
  --js /opt/google/closure-library/closure/goog/vec/vec2.js \
  --js /opt/google/closure-library/closure/goog/vec/vec3.js \
  --js /opt/google/closure-library/closure/goog/vec/vec4.js \
  --js /opt/google/closure-library/closure/goog/webgl/webgl.js \
  --js_output_file test.js \
  --language_in=ECMASCRIPT5 \
  --language_out=ECMASCRIPT5