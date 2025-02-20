# Copyright (c) 2019 Maxim Egorushkin. MIT License. See the full licence in file LICENSE.

# time make -rC ~/src/atomic_queue -j8 run_benchmarks
# time make -rC ~/src/atomic_queue -j8 TOOLSET=clang run_benchmarks
# time make -rC ~/src/atomic_queue -j8 BUILD=debug run_tests

SHELL := /bin/bash
BUILD := release

TOOLSET := gcc
build_dir := ${CURDIR}/${BUILD}/${TOOLSET}

cxx.gcc := g++
cc.gcc := gcc
ld.gcc := g++
ar.gcc := gcc-ar

cxx.clang := clang++
cc.clang := clang
ld.clang := clang++
ar.clang := ar

CXX := ${cxx.${TOOLSET}}
CC := ${cc.${TOOLSET}}
LD := ${ld.${TOOLSET}}
AR := ${ar.${TOOLSET}}

cxxflags.gcc.debug := -Og -fstack-protector-all -fno-omit-frame-pointer # -D_GLIBCXX_DEBUG
cxxflags.gcc.release := -O3 -mtune=native -ffast-math -falign-{functions,loops}=32 -DNDEBUG
cxxflags.gcc := -pthread -march=native -std=gnu++14 -W{all,extra,error,no-{maybe-uninitialized,unused-function}} -g -fmessage-length=0 ${cxxflags.gcc.${BUILD}}

cflags.gcc := -pthread -march=native -W{all,extra} -g -fmessage-length=0 ${cxxflags.gcc.${BUILD}}

cxxflags.clang.debug := -O0 -fstack-protector-all
cxxflags.clang.release := -O3 -mtune=native -ffast-math -falign-functions=32 -DNDEBUG
cxxflags.clang := -stdlib=libc++ -pthread -march=native -std=gnu++14 -W{all,extra,error} -g -fmessage-length=0 ${cxxflags.clang.${BUILD}}
ldflags.clang := -stdlib=libc++ ${ldflags.clang.${BUILD}}

# Additional CPPFLAGS, CXXFLAGS, CFLAGS, LDLIBS, LDFLAGS can come from the command line, e.g. make CXXFLAGS='-march=skylake -mtune=skylake'.
# However, a clean build is required when changing the flags in the command line.
cxxflags := ${cxxflags.${TOOLSET}} ${CXXFLAGS}
cflags := ${cflags.${TOOLSET}} ${CFLAGS}
cppflags := ${CPPFLAGS}
ldflags := -fuse-ld=gold -pthread -g ${ldflags.${TOOLSET}} ${LDFLAGS}
ldlibs := -lrt ${LDLIBS}

cppflags.tbb :=
ldlibs.tbb := {-L,'-Wl,-rpath='}/usr/local/lib -ltbb

cppflags.moodycamel := -I$(abspath ..)
ldlibs.moodycamel :=

COMPILE.CXX = ${CXX} -o $@ -c ${cppflags} ${cxxflags} -MD -MP $(abspath $<)
COMPILE.S = ${CXX} -o- -S -masm=intel ${cppflags} ${cxxflags} $(abspath $<) | c++filt > $@
PREPROCESS.CXX = ${CXX} -o $@ -E ${cppflags} ${cxxflags} $(abspath $<)
COMPILE.C = ${CC} -o $@ -c ${cppflags} ${cflags} -MD -MP $(abspath $<)
LINK.EXE = ${LD} -o $@ $(ldflags) $(filter-out Makefile,$^) $(ldlibs)
LINK.SO = ${LD} -o $@ -shared $(ldflags) $(filter-out Makefile,$^) $(ldlibs)
LINK.A = ${AR} rscT $@ $(filter-out Makefile,$^)

exes := benchmarks tests

all : ${exes}

${exes} : % : ${build_dir}/%
	ln -sf ${<:${CURDIR}/%=%}

${build_dir}/libatomic_queue.a : ${build_dir}/cpu_base_frequency.o

${build_dir}/benchmarks : cppflags += ${cppflags.tbb} ${cppflags.moodycamel}
${build_dir}/benchmarks : ldlibs += ${ldlibs.tbb} ${ldlibs.moodycamel}
${build_dir}/benchmarks : ${build_dir}/benchmarks.o ${build_dir}/libatomic_queue.a Makefile | ${build_dir}
	$(strip ${LINK.EXE})
-include ${build_dir}/benchmarks.d

${build_dir}/tests : cppflags += ${cppflags.moodycamel}
${build_dir}/tests : ldlibs += ${ldlibs.moodycamel} -lboost_unit_test_framework
${build_dir}/tests : ${build_dir}/tests.o Makefile | ${build_dir}
	$(strip ${LINK.EXE})
-include ${build_dir}/tests.d

${build_dir}/%.so : cxxflags += -fPIC
${build_dir}/%.so : Makefile | ${build_dir}
	$(strip ${LINK.SO})

${build_dir}/%.a : Makefile | ${build_dir}
	$(strip ${LINK.A})

run_benchmarks : ${build_dir}/benchmarks
	@echo "---- running $< ----"
	sudo chrt -f 50 $<
#	sudo chrt -f 50 perf stat -d $<

run_tests : ${build_dir}/tests
	@echo "---- running $< ----"
	$<

${build_dir}/%.o : %.cc Makefile | ${build_dir}
	$(strip ${COMPILE.CXX})

${build_dir}/%.o : %.c Makefile | ${build_dir}
	$(strip ${COMPILE.C})

%.S : %.cc Makefile | ${build_dir}
	$(strip ${COMPILE.S})

%.I : %.cc
	$(strip ${PREPROCESS.CXX})

${build_dir} :
	mkdir -p $@

rtags : clean
	${MAKE} -nk | rc -c -; true

clean :
	rm -rf ${build_dir}

.PHONY : rtags run_benchmarks clean all run_%
