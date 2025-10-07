# @generated
# (c) Meta Platforms, Inc. and affiliates. Confidential and proprietary.


def xrpa_debug_bounds_assert(
    offset: int, required_size: int, total_size: int, min_range: int = 0
):
    access_end = offset + required_size
    if required_size < 0 or offset < min_range or access_end > total_size:
        msg = f"Memory access violation: [{offset}, {access_end}] reaches outside of range [{min_range}, {total_size}]"
        raise RuntimeError(msg)


def xrpa_debug_assert(condition: bool, msg: str = "Assertion failed"):
    if not condition:
        raise RuntimeError(msg)
