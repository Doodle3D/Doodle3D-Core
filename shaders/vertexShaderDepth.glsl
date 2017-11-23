varying float vFragDepth;
uniform float logDepthBufFC;

#include <common>
#include <morphtarget_pars_vertex>

void main() {
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>

	// gl_Position.z = log2(max( EPSILON, gl_Position.w + 1.0 )) * logDepthBufFC;
	vFragDepth = 1.0 + gl_Position.w;
}
