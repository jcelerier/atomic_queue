/* -*- mode: c++; c-basic-offset: 4; indent-tabs-mode: nil; tab-width: 4 -*- */
#ifndef MOODYCAMEL_H_INCLUDED
#define MOODYCAMEL_H_INCLUDED

// Copyright (c) 2019 Maxim Egorushkin. MIT License. See the full licence in file LICENSE.

#include <concurrentqueue/concurrentqueue.h>
#include <readerwriterqueue/readerwriterqueue.h>

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

namespace atomic_queue {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

template<class T, unsigned Capacity>
struct MoodyCamelQueue : moodycamel::ConcurrentQueue<T> {
    MoodyCamelQueue()
        : moodycamel::ConcurrentQueue<T>(Capacity)
    {}

    void push(T element) {
        while(!this->try_enqueue(element))
            ;
    }

    T pop() {
        T element;
        while(!this->try_dequeue(element))
            ;
        return element;
    }
};

template<class T, unsigned Capacity>
struct MoodyCamelReaderWriterQueue : moodycamel::ReaderWriterQueue<T> {
    MoodyCamelReaderWriterQueue()
        : moodycamel::ReaderWriterQueue<T>(Capacity)
    {}

    void push(T element) {
        while(!this->try_enqueue(element))
            ;
    }

    T pop() {
        T element;
        while(!this->try_dequeue(element))
            ;
        return element;
    }
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

} // quorum

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

#endif // MOODYCAMEL_H_INCLUDED
