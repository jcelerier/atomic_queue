/* -*- mode: c++; c-basic-offset: 4; indent-tabs-mode: nil; tab-width: 4 -*- */
#ifndef ATOMIC_QUEUE_SPIN_LOCK_H_INCLUDED
#define ATOMIC_QUEUE_SPIN_LOCK_H_INCLUDED

// Copyright (c) 2019 Maxim Egorushkin. MIT License. See the full licence in file LICENSE.

#include "defs.h"

#include <cstdlib>
#include <atomic>
#include <mutex>

// #include <emmintrin.h>
#include <pthread.h>

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

namespace atomic_queue {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class Spinlock {
    pthread_spinlock_t s_;
public:
    using scoped_lock = std::lock_guard<Spinlock>;

    Spinlock() noexcept {
        if(::pthread_spin_init(&s_, 0))
            std::abort();
    }

    ~Spinlock() noexcept {
        ::pthread_spin_destroy(&s_);
    }

    void lock() noexcept {
        if(::pthread_spin_lock(&s_))
            std::abort();
    }

    void unlock() noexcept {
        if(::pthread_spin_unlock(&s_))
            std::abort();
    }
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class FairSpinlock {
    alignas(CACHE_LINE_SIZE) std::atomic<unsigned> ticket_{0};
    alignas(CACHE_LINE_SIZE) std::atomic<unsigned> next_{0};
public:
    using scoped_lock = std::lock_guard<FairSpinlock>;

    void lock() noexcept {
        auto ticket = ticket_.fetch_add(1, std::memory_order_relaxed);
        while(next_.load(std::memory_order_acquire) != ticket)
            _mm_pause();
    }

    void unlock() noexcept {
        next_.fetch_add(1, std::memory_order_release);
    }
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class UnfairSpinlock {
    std::atomic<unsigned> lock_{0};
public:
    using scoped_lock = std::lock_guard<UnfairSpinlock>;

    void lock() noexcept {
        for(;;) {
            if(!lock_.load(std::memory_order_relaxed) && !lock_.exchange(1, std::memory_order_acquire))
                return;
            _mm_pause();
        }
    }

    void unlock() noexcept {
        lock_.store(0, std::memory_order_release);
    }
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

class SpinlockHle {
    int lock_ = 0;

#ifdef __gcc__
    static constexpr int HLE_ACQUIRE = __ATOMIC_HLE_ACQUIRE;
    static constexpr int HLE_RELEASE = __ATOMIC_HLE_RELEASE;
#else
    static constexpr int HLE_ACQUIRE = 0;
    static constexpr int HLE_RELEASE = 0;
#endif

public:
    using scoped_lock = std::lock_guard<Spinlock>;

    void lock() noexcept {
        for(int expected = 0; !__atomic_compare_exchange_n(&lock_, &expected, 1, false, __ATOMIC_ACQUIRE | HLE_ACQUIRE, __ATOMIC_RELAXED); expected = 0)
            _mm_pause();
    }

    void unlock() noexcept {
        __atomic_store_n(&lock_, 0, __ATOMIC_RELEASE | HLE_RELEASE);
    }
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

} // atomic_queue

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

#endif // ATOMIC_QUEUE_SPIN_LOCK_H_INCLUDED
